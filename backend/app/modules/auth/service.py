from fastapi import HTTPException, status
from app.core.security import create_access_token, get_password_hash, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork = None):
        self.uow = uow or UsuarioUnitOfWork()

    def register(self, data: UserCreate) -> UserPublic:
        with self.uow as uow:
            if uow.usuarios.get_by_username(data.username):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El nombre de usuario ya está registrado",
                )
            if uow.usuarios.get_by_email(data.email):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El correo electrónico ya está registrado",
                )

            hashed_pw = get_password_hash(data.password)
            user = Usuario(
                username=data.username,
                full_name=data.full_name,
                email=data.email,
                hashed_password=hashed_pw,
                role="user",
                disabled=False,
            )
            uow.usuarios.add(user)
            return UserPublic.model_validate(user)

    def login(self, username: str, password: str) -> str:
        with self.uow as uow:
            user = uow.usuarios.get_by_username(username)
            if not user or not verify_password(password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales incorrectas",
                )

            if user.disabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cuenta de usuario desactivada",
                )

            token = create_access_token(data={"sub": user.username, "role": user.role})
            return token
