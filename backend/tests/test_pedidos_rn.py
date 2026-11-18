import unittest
from datetime import datetime, timezone
from pydantic import ValidationError
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session, create_engine, select

from app.core.deps import require_role
from app.modules.categorias.models import Categoria
from app.modules.pedidos.models import Pedido
from app.modules.pedidos.router import router as pedidos_router
from app.modules.pedidos.schemas import (
    CambioEstado,
    ItemPedidoCreate,
    PedidoCreate,
    PedidoRead,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoDisponible,
    ProductoNoEncontrado,
    ProductoRepetido,
    StockInsuficiente,
    TransicionInvalida,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario


class TestPedidosReglasNegocio(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        SQLModel.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(
            bind=self.engine, class_=Session, expire_on_commit=False
        )

        self.uow = PedidoUnitOfWork(session_maker=self.session_factory)
        self.service = PedidoService(uow=self.uow)

        # Setup básico: 1 admin, 2 clientes, 1 categoría y 3 productos
        with Session(self.engine) as s:
            admin = Usuario(
                username="admin_pedidos",
                full_name="Admin Pedidos",
                email="admin_pedidos@test.com",
                hashed_password="hash",
                role="admin",
                disabled=False,
            )
            cliente1 = Usuario(
                username="cliente1",
                full_name="Cliente Uno",
                email="cliente1@test.com",
                hashed_password="hash",
                role="user",
                disabled=False,
            )
            cliente2 = Usuario(
                username="cliente2",
                full_name="Cliente Dos",
                email="cliente2@test.com",
                hashed_password="hash",
                role="user",
                disabled=False,
            )
            s.add(admin)
            s.add(cliente1)
            s.add(cliente2)

            cat = Categoria(nombre="Platos Principales", activo=True)
            s.add(cat)
            s.commit()

            self.admin_id = admin.id
            self.cliente1_id = cliente1.id
            self.cliente2_id = cliente2.id

            prod1 = Producto(
                categoria_id=cat.id,
                nombre="Lasaña Casera",
                precio_base=8000.0,
                stock=10,
                disponible=True,
                activo=True,
            )
            prod2 = Producto(
                categoria_id=cat.id,
                nombre="Ravioles con Salsa",
                precio_base=7000.0,
                stock=5,
                disponible=True,
                activo=True,
            )
            prod_no_disp = Producto(
                categoria_id=cat.id,
                nombre="Sorrentinos",
                precio_base=7500.0,
                stock=10,
                disponible=False,
                activo=True,
            )
            prod_inactivo = Producto(
                categoria_id=cat.id,
                nombre="Canelones",
                precio_base=7200.0,
                stock=10,
                disponible=True,
                activo=False,
            )
            s.add(prod1)
            s.add(prod2)
            s.add(prod_no_disp)
            s.add(prod_inactivo)
            s.commit()

            self.prod1_id = prod1.id
            self.prod2_id = prod2.id
            self.prod_no_disp_id = prod_no_disp.id
            self.prod_inactivo_id = prod_inactivo.id

    def test_01_rn01_crear_pedido_exitoso(self):
        """RN-01: Creación correcta, descuenta stock, calcula total, nace en PENDIENTE."""
        data = PedidoCreate(
            items=[
                ItemPedidoCreate(producto_id=self.prod1_id, cantidad=2),
                ItemPedidoCreate(producto_id=self.prod2_id, cantidad=1),
            ],
            forma_pago="EFECTIVO",
            direccion_entrega="Av. Rivadavia 1234",
            notas="Timbre 2B",
        )

        pedido = self.service.crear_pedido(self.cliente1_id, data)

        self.assertEqual(pedido.estado, "PENDIENTE")
        self.assertEqual(pedido.forma_pago, "EFECTIVO")
        self.assertEqual(pedido.direccion_entrega, "Av. Rivadavia 1234")
        self.assertEqual(pedido.notas, "Timbre 2B")
        # 2 * 8000 + 1 * 7000 = 23000.0
        self.assertEqual(pedido.total, 23000.0)
        self.assertEqual(len(pedido.items), 2)

        # Verificar descuento en la base de datos
        with Session(self.engine) as s:
            p1 = s.get(Producto, self.prod1_id)
            p2 = s.get(Producto, self.prod2_id)
            self.assertEqual(p1.stock, 8)  # 10 - 2
            self.assertEqual(p2.stock, 4)  # 5 - 1

    def test_02_rn01_productos_repetidos_400(self):
        """RN-01: Falla si se repite un producto en el carrito (ProductoRepetido)."""
        data = PedidoCreate(
            items=[
                ItemPedidoCreate(producto_id=self.prod1_id, cantidad=1),
                ItemPedidoCreate(producto_id=self.prod1_id, cantidad=2),
            ],
            forma_pago="TRANSFERENCIA",
            direccion_entrega="Calle 12345",
        )
        with self.assertRaises(ProductoRepetido):
            self.service.crear_pedido(self.cliente1_id, data)

    def test_03_rn01_producto_inexistente_o_inactivo_404(self):
        """RN-01: Falla si un producto no existe o está inactivo (ProductoNoEncontrado)."""
        # Inexistente
        data_inexistente = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=9999, cantidad=1)],
            forma_pago="EFECTIVO",
            direccion_entrega="Calle 12345",
        )
        with self.assertRaises(ProductoNoEncontrado):
            self.service.crear_pedido(self.cliente1_id, data_inexistente)

        # Inactivo
        data_inactivo = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=self.prod_inactivo_id, cantidad=1)],
            forma_pago="EFECTIVO",
            direccion_entrega="Calle 12345",
        )
        with self.assertRaises(ProductoNoEncontrado):
            self.service.crear_pedido(self.cliente1_id, data_inactivo)

    def test_04_rn01_producto_no_disponible_o_stock_insuficiente_400(self):
        """RN-01: Falla si no está disponible o stock insuficiente; rollback total garantizado."""
        # No disponible
        data_no_disp = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=self.prod_no_disp_id, cantidad=1)],
            forma_pago="EFECTIVO",
            direccion_entrega="Calle 12345",
        )
        with self.assertRaises(ProductoNoDisponible):
            self.service.crear_pedido(self.cliente1_id, data_no_disp)

        # Stock insuficiente en el segundo ítem (prod2 solo tiene 5, se piden 6)
        data_stock = PedidoCreate(
            items=[
                ItemPedidoCreate(producto_id=self.prod1_id, cantidad=2),
                ItemPedidoCreate(producto_id=self.prod2_id, cantidad=6),
            ],
            forma_pago="EFECTIVO",
            direccion_entrega="Calle 12345",
        )
        with self.assertRaises(StockInsuficiente):
            self.service.crear_pedido(self.cliente1_id, data_stock)

        # Rollback atómico: verificar que el stock de prod1 SIGUE en 10
        with Session(self.engine) as s:
            p1 = s.get(Producto, self.prod1_id)
            self.assertEqual(p1.stock, 10)
            pedidos = s.exec(select(Pedido)).all()
            self.assertEqual(len(pedidos), 0)

    def test_05_rn02_maquina_de_estados(self):
        """RN-02: Máquina de estados (PENDIENTE -> EN_PREPARACION -> ENTREGADO / CANCELADO)."""
        data = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=self.prod1_id, cantidad=1)],
            forma_pago="EFECTIVO",
            direccion_entrega="Calle 12345",
        )
        pedido = self.service.crear_pedido(self.cliente1_id, data)

        # 1. Transición inválida directa: PENDIENTE -> ENTREGADO
        with self.assertRaises(TransicionInvalida):
            self.service.cambiar_estado(pedido.id, "ENTREGADO")

        # 2. Transición válida: PENDIENTE -> EN_PREPARACION
        p_prep = self.service.cambiar_estado(pedido.id, "EN_PREPARACION")
        self.assertEqual(p_prep.estado, "EN_PREPARACION")

        # 3. Transición válida: EN_PREPARACION -> ENTREGADO
        p_ent = self.service.cambiar_estado(pedido.id, "ENTREGADO")
        self.assertEqual(p_ent.estado, "ENTREGADO")

        # 4. Estado terminal ENTREGADO no admite cambios
        with self.assertRaises(TransicionInvalida):
            self.service.cambiar_estado(pedido.id, "CANCELADO")

    def test_06_rn03_cancelar_restituye_stock(self):
        """RN-03: Cancelar restituye el stock en la misma transacción."""
        data = PedidoCreate(
            items=[
                ItemPedidoCreate(producto_id=self.prod1_id, cantidad=3),
                ItemPedidoCreate(producto_id=self.prod2_id, cantidad=2),
            ],
            forma_pago="TRANSFERENCIA",
            direccion_entrega="Calle 12345",
        )
        pedido = self.service.crear_pedido(self.cliente1_id, data)

        # Verificar que bajó el stock
        with Session(self.engine) as s:
            self.assertEqual(s.get(Producto, self.prod1_id).stock, 7)
            self.assertEqual(s.get(Producto, self.prod2_id).stock, 3)

        # El cliente cancela su pedido en PENDIENTE
        p_canc = self.service.cancelar_pedido_cliente(pedido.id, self.cliente1_id)
        self.assertEqual(p_canc.estado, "CANCELADO")

        # Verificar restitución total del stock
        with Session(self.engine) as s:
            self.assertEqual(s.get(Producto, self.prod1_id).stock, 10)
            self.assertEqual(s.get(Producto, self.prod2_id).stock, 5)

    def test_07_rn04_permisos_dueno_y_rol(self):
        """RN-04: Cliente solo ve y cancela propios pedidos y solo en PENDIENTE; Admin ve todos."""
        data = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=self.prod1_id, cantidad=1)],
            forma_pago="EFECTIVO",
            direccion_entrega="Calle 12345",
        )
        pedido1 = self.service.crear_pedido(self.cliente1_id, data)

        # Cliente 2 intenta ver el pedido de Cliente 1 -> 403 (PedidoAjeno)
        with self.assertRaises(PedidoAjeno):
            self.service.get_by_id(pedido1.id, self.cliente2_id, role="user")

        # Cliente 2 intenta cancelar el pedido de Cliente 1 -> 403 (PedidoAjeno)
        with self.assertRaises(PedidoAjeno):
            self.service.cancelar_pedido_cliente(pedido1.id, self.cliente2_id)

        # Admin sí puede ver el pedido de Cliente 1
        admin_view = self.service.get_by_id(pedido1.id, self.admin_id, role="admin")
        self.assertEqual(admin_view.id, pedido1.id)

        # Si el admin avanza el pedido a EN_PREPARACION:
        self.service.cambiar_estado(pedido1.id, "EN_PREPARACION")

        # Cliente 1 ya NO puede cancelar porque no está en PENDIENTE
        with self.assertRaises(TransicionInvalida):
            self.service.cancelar_pedido_cliente(pedido1.id, self.cliente1_id)

        # Filtrado en listado: Cliente solo ve sus propios pedidos
        pedido2 = self.service.crear_pedido(self.cliente2_id, data)
        list_c1 = self.service.list_pedidos(usuario_id=self.cliente1_id)
        self.assertEqual(list_c1.total, 1)
        self.assertEqual(list_c1.items[0].id, pedido1.id)

        # Admin listando ve ambos
        list_admin = self.service.list_pedidos(usuario_id=None)
        self.assertEqual(list_admin.total, 2)

    def test_08_rn05_inmutabilidad(self):
        """RN-05: No hay endpoints de modificación ni de borrado físico para pedidos."""
        import app.modules.pedidos.router as ped_router_mod

        # Inspeccionar rutas del router de pedidos
        for route in pedidos_router.routes:
            methods = getattr(route, "methods", set())
            self.assertNotIn("DELETE", methods, "No debe haber ningún endpoint DELETE en pedidos!")
            self.assertNotIn("PUT", methods, "No debe haber ningún endpoint PUT en pedidos!")

    def test_09_rn06_validacion_datos_schema(self):
        """RN-06: forma_pago EFECTIVO|TRANSFERENCIA, direccion 5..200 caracteres, items >= 1."""
        # 1. Forma de pago inválida
        with self.assertRaises(ValidationError):
            PedidoCreate(
                items=[ItemPedidoCreate(producto_id=1, cantidad=1)],
                forma_pago="BITCOIN",
                direccion_entrega="Calle 12345",
            )

        # 2. Dirección menor a 5 caracteres
        with self.assertRaises(ValidationError):
            PedidoCreate(
                items=[ItemPedidoCreate(producto_id=1, cantidad=1)],
                forma_pago="EFECTIVO",
                direccion_entrega="Hola",
            )

        # 3. Dirección mayor a 200 caracteres
        with self.assertRaises(ValidationError):
            PedidoCreate(
                items=[ItemPedidoCreate(producto_id=1, cantidad=1)],
                forma_pago="EFECTIVO",
                direccion_entrega="A" * 201,
            )

        # 4. Sin items
        with self.assertRaises(ValidationError):
            PedidoCreate(
                items=[],
                forma_pago="EFECTIVO",
                direccion_entrega="Calle 12345",
            )

        # 5. Cantidad menor a 1
        with self.assertRaises(ValidationError):
            ItemPedidoCreate(producto_id=1, cantidad=0)

    def test_10_resumen_indicadores_panel(self):
        """Verifica conteos de estados, pedidos_hoy e ingresos_entregados en ResumenPedidos."""
        # Crear pedidos en distintos estados
        data = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=self.prod1_id, cantidad=1)],
            forma_pago="EFECTIVO",
            direccion_entrega="Calle 12345",
        )
        # Pedido 1: PENDIENTE (total 8000)
        p1 = self.service.crear_pedido(self.cliente1_id, data)

        # Pedido 2: Pasa a EN_PREPARACION (total 8000)
        p2 = self.service.crear_pedido(self.cliente1_id, data)
        self.service.cambiar_estado(p2.id, "EN_PREPARACION")

        # Pedido 3: Pasa a ENTREGADO (total 8000)
        p3 = self.service.crear_pedido(self.cliente2_id, data)
        self.service.cambiar_estado(p3.id, "EN_PREPARACION")
        self.service.cambiar_estado(p3.id, "ENTREGADO")

        # Pedido 4: Pasa a CANCELADO (total 8000)
        p4 = self.service.crear_pedido(self.cliente2_id, data)
        self.service.cambiar_estado(p4.id, "CANCELADO")

        resumen = self.service.get_resumen()
        self.assertIsInstance(resumen, ResumenPedidos)
        self.assertEqual(resumen.pendientes, 1)
        self.assertEqual(resumen.en_preparacion, 1)
        self.assertEqual(resumen.entregados, 1)
        self.assertEqual(resumen.cancelados, 1)
        self.assertEqual(resumen.pedidos_hoy, 4)
        # Solo suma el total de ENTREGADO: 8000.0
        self.assertEqual(resumen.ingresos_entregados, 8000.0)


if __name__ == "__main__":
    unittest.main()
