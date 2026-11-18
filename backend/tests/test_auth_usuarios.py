import unittest
from datetime import timedelta
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session, create_engine
from starlette.requests import Request
from starlette.responses import Response

from app.core.deps import get_current_active_user, get_current_user, require_role
from app.core.security import create_access_token, verify_password
from app.modules.auth.router import get_me, login, logout, register
from app.modules.auth.service import AuthService
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.router import (
    activar_usuario,
    desactivar_usuario,
    list_usuarios,
)
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class TestAuthAndUsuarios(unittest.TestCase):
    def setUp(self):
        # Base de datos en memoria para aislar cada prueba
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        SQLModel.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine, class_=Session)
        self.uow = UsuarioUnitOfWork(session_maker=self.session_factory)
        self.auth_service = AuthService(uow=self.uow)
        self.usuario_service = UsuarioService(uow=self.uow)

    def test_01_registro_publico_exitoso(self):
        """Registro público: crea usuario rol 'user', activo, hash bcrypt y sin hashed_password en output."""
        data = UserCreate(
            username="juanperez",
            full_name="Juan Perez",
            email="juan@ejemplo.com",
            password="PasswordSeguro123!",
        )
        user_pub = self.auth_service.register(data)

        self.assertIsInstance(user_pub, UserPublic)
        self.assertEqual(user_pub.username, "juanperez")
        self.assertEqual(user_pub.email, "juan@ejemplo.com")
        self.assertEqual(user_pub.role, "user")
        self.assertFalse(user_pub.disabled)
        self.assertFalse(hasattr(user_pub, "hashed_password"))

        # Verificar en base de datos que la contraseña está hasheada
        with self.session_factory() as s:
            u_db = self.uow.usuarios.get_by_username("juanperez")
            self.assertNotEqual(u_db.hashed_password, "PasswordSeguro123!")
            self.assertTrue(verify_password("PasswordSeguro123!", u_db.hashed_password))

    def test_02_registro_duplicado_username_o_email_409(self):
        """Registro duplicado responde 409 tanto por username como por email."""
        data1 = UserCreate(
            username="maria",
            full_name="Maria Gomez",
            email="maria@ejemplo.com",
            password="PasswordSeguro123!",
        )
        self.auth_service.register(data1)

        # Mismo username
        data_dup_user = UserCreate(
            username="maria",
            full_name="Maria Otra",
            email="otra_maria@ejemplo.com",
            password="PasswordSeguro123!",
        )
        with self.assertRaises(HTTPException) as cm_user:
            self.auth_service.register(data_dup_user)
        self.assertEqual(cm_user.exception.status_code, 409)

        # Mismo email
        data_dup_email = UserCreate(
            username="maria_nueva",
            full_name="Maria Nueva",
            email="maria@ejemplo.com",
            password="PasswordSeguro123!",
        )
        with self.assertRaises(HTTPException) as cm_email:
            self.auth_service.register(data_dup_email)
        self.assertEqual(cm_email.exception.status_code, 409)

    def test_03_login_credenciales_incorrectas_401(self):
        """Login con contraseña errónea o usuario inexistente lanza 401."""
        data = UserCreate(
            username="pedro",
            full_name="Pedro Pascal",
            email="pedro@ejemplo.com",
            password="MiPassword123!",
        )
        self.auth_service.register(data)

        # Usuario inexistente
        with self.assertRaises(HTTPException) as cm_no_user:
            self.auth_service.login("fantasma", "MiPassword123!")
        self.assertEqual(cm_no_user.exception.status_code, 401)
        self.assertEqual(cm_no_user.exception.detail, "Credenciales incorrectas")

        # Contraseña incorrecta
        with self.assertRaises(HTTPException) as cm_bad_pw:
            self.auth_service.login("pedro", "PasswordIncorrecto123!")
        self.assertEqual(cm_bad_pw.exception.status_code, 401)
        self.assertEqual(cm_bad_pw.exception.detail, "Credenciales incorrectas")

    def test_04_login_cuenta_desactivada_400(self):
        """Login con cuenta desactivada responde 400 'Cuenta de usuario desactivada'."""
        data = UserCreate(
            username="desactivado",
            full_name="Usuario Inactivo",
            email="inactivo@ejemplo.com",
            password="MiPassword123!",
        )
        user = self.auth_service.register(data)

        # Desactivar usuario
        with self.session_factory() as s:
            u_db = s.get(Usuario, user.id)
            u_db.disabled = True
            s.add(u_db)
            s.commit()

        with self.assertRaises(HTTPException) as cm:
            self.auth_service.login("desactivado", "MiPassword123!")
        self.assertEqual(cm.exception.status_code, 400)
        self.assertEqual(cm.exception.detail, "Cuenta de usuario desactivada")

    def test_05_login_endpoint_cookie_httponly(self):
        """POST /auth/token establece cookie HttpOnly access_token y no expone el token en el cuerpo."""
        data = UserCreate(
            username="clara",
            full_name="Clara Luna",
            email="clara@ejemplo.com",
            password="MiPassword123!",
        )
        self.auth_service.register(data)

        form_data = OAuth2PasswordRequestForm(
            grant_type="password",
            username="clara",
            password="MiPassword123!",
            scope="",
            client_id=None,
            client_secret=None,
        )

        response = Response()
        result = login(response=response, form_data=form_data, service=self.auth_service)

        # El cuerpo no incluye el token
        self.assertEqual(result.message, "Login exitoso")
        self.assertFalse(hasattr(result, "access_token"))

        # La cookie HttpOnly access_token viaja en Set-Cookie
        set_cookie_header = response.headers.get("set-cookie")
        self.assertIsNotNone(set_cookie_header)
        self.assertIn("access_token=", set_cookie_header)
        self.assertIn("HttpOnly", set_cookie_header)
        self.assertIn("SameSite=lax", set_cookie_header)

    def test_06_logout_borra_cookie(self):
        """POST /auth/logout borra la cookie access_token."""
        response = Response()
        res = logout(response=response)
        self.assertEqual(res.message, "Logout exitoso")

        set_cookie = response.headers.get("set-cookie", "")
        # En eliminación de cookie se envía Max-Age=0 o valor vacío
        self.assertTrue("access_token=\"\"" in set_cookie or "Max-Age=0" in set_cookie or "access_token=;" in set_cookie)

    def test_07_deps_get_current_user_y_active_user(self):
        """get_current_user lee la cookie y get_current_active_user valida que no esté desactivado."""
        data = UserCreate(
            username="lucas",
            full_name="Lucas V",
            email="lucas@ejemplo.com",
            password="Password123!",
        )
        self.auth_service.register(data)

        token = create_access_token(data={"sub": "lucas", "role": "user"})

        with self.session_factory() as session:
            # 1. Petición sin cookie -> 401
            req_sin_cookie = Request({"type": "http", "headers": []})
            with self.assertRaises(HTTPException) as cm1:
                get_current_user(request=req_sin_cookie, session=session)
            self.assertEqual(cm1.exception.status_code, 401)

            # 2. Petición con cookie inválida -> 401
            req_invalido = Request(
                {"type": "http", "headers": [(b"cookie", b"access_token=token_falso_invalido")]}
            )
            with self.assertRaises(HTTPException) as cm2:
                get_current_user(request=req_invalido, session=session)
            self.assertEqual(cm2.exception.status_code, 401)

            # 3. Petición con token expirado -> 401
            token_exp = create_access_token(
                data={"sub": "lucas", "role": "user"},
                expires_delta=timedelta(seconds=-10),
            )
            req_exp = Request(
                {"type": "http", "headers": [(b"cookie", f"access_token={token_exp}".encode())]}
            )
            with self.assertRaises(HTTPException) as cm3:
                get_current_user(request=req_exp, session=session)
            self.assertEqual(cm3.exception.status_code, 401)

            # 4. Petición válida -> Retorna usuario
            req_valido = Request(
                {"type": "http", "headers": [(b"cookie", f"access_token={token}".encode())]}
            )
            user = get_current_user(request=req_valido, session=session)
            self.assertEqual(user.username, "lucas")

            # get_current_active_user pasa si no está disabled
            active_user = get_current_active_user(current_user=user)
            self.assertEqual(active_user.id, user.id)

            # Si el usuario es desactivado -> get_current_active_user responde 400
            user.disabled = True
            with self.assertRaises(HTTPException) as cm4:
                get_current_active_user(current_user=user)
            self.assertEqual(cm4.exception.status_code, 400)
            self.assertEqual(cm4.exception.detail, "Cuenta de usuario desactivada")

    def test_08_deps_require_role(self):
        """require_role permite rol admin y rechaza rol user con 403."""
        admin_user = Usuario(
            username="admin_test",
            full_name="Admin Test",
            email="admin@test.com",
            hashed_password="hash",
            role="admin",
            disabled=False,
        )
        regular_user = Usuario(
            username="user_test",
            full_name="User Test",
            email="user@test.com",
            hashed_password="hash",
            role="user",
            disabled=False,
        )

        checker = require_role(["admin"])

        # Admin pasa
        allowed = checker(current_user=admin_user)
        self.assertEqual(allowed.username, "admin_test")

        # User regular es rechazado con 403
        with self.assertRaises(HTTPException) as cm:
            checker(current_user=regular_user)
        self.assertEqual(cm.exception.status_code, 403)

    def test_09_gestion_usuarios_admin_activar_desactivar(self):
        """Listado, activación y desactivación de usuarios para rol admin."""
        # Crear admin y 2 usuarios
        with self.session_factory() as s:
            admin = Usuario(
                username="superadmin",
                full_name="Super Admin",
                email="super@test.com",
                hashed_password="hash",
                role="admin",
                disabled=False,
            )
            u1 = Usuario(
                username="usuario1",
                full_name="Usuario 1",
                email="u1@test.com",
                hashed_password="hash",
                role="user",
                disabled=False,
            )
            s.add(admin)
            s.add(u1)
            s.commit()
            s.refresh(admin)
            s.refresh(u1)
            admin_id = admin.id
            u1_id = u1.id

        # 1. Listado de usuarios
        lista = list_usuarios(current_admin=admin, service=self.usuario_service)
        self.assertGreaterEqual(len(lista), 2)

        # 2. Desactivar usuario u1
        desactivado = desactivar_usuario(
            id=u1_id, current_admin=admin, service=self.usuario_service
        )
        self.assertTrue(desactivado.disabled)

        # Idempotencia: desactivar de nuevo responde 200 con disabled=True
        desactivado2 = desactivar_usuario(
            id=u1_id, current_admin=admin, service=self.usuario_service
        )
        self.assertTrue(desactivado2.disabled)

        # 3. Reactivar usuario u1
        activado = activar_usuario(id=u1_id, current_admin=admin, service=self.usuario_service)
        self.assertFalse(activado.disabled)

        # Idempotencia: activar de nuevo responde 200 con disabled=False
        activado2 = activar_usuario(id=u1_id, current_admin=admin, service=self.usuario_service)
        self.assertFalse(activado2.disabled)

        # 4. Error 400: admin no puede desactivarse a sí mismo
        with self.assertRaises(HTTPException) as cm_self:
            desactivar_usuario(
                id=admin_id, current_admin=admin, service=self.usuario_service
            )
        self.assertEqual(cm_self.exception.status_code, 400)
        self.assertEqual(cm_self.exception.detail, "El administrador no puede desactivarse a sí mismo")

        # 5. Error 404: usuario inexistente
        with self.assertRaises(HTTPException) as cm_404_act:
            activar_usuario(id=99999, current_admin=admin, service=self.usuario_service)
        self.assertEqual(cm_404_act.exception.status_code, 404)

        with self.assertRaises(HTTPException) as cm_404_des:
            desactivar_usuario(id=99999, current_admin=admin, service=self.usuario_service)
        self.assertEqual(cm_404_des.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
