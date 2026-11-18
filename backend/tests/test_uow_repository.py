import inspect
import unittest
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session, create_engine, select

from app.core.base_repository import BaseRepository
from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.categorias.router import router as categorias_router
from app.modules.categorias.service import CategoriaService
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.pedidos.models import Pedido
from app.modules.pedidos.router import router as pedidos_router
from app.modules.pedidos.schemas import ItemPedidoCreate, PedidoCreate
from app.modules.pedidos.service import (
    PedidoService,
    ProductoNoDisponible,
    ProductoRepetido,
    StockInsuficiente,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.models import Producto
from app.modules.productos.router import router as productos_router
from app.modules.productos.service import ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork
from app.modules.usuarios.models import Usuario


class TestUnitOfWorkAndRepository(unittest.TestCase):
    def setUp(self):
        # Base de datos en memoria para aislamiento por cada prueba
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        SQLModel.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine, class_=Session)

    def test_01_base_repository_crud(self):
        """Verifica get_by_id, get_all, add y delete en BaseRepository."""
        with Session(self.engine) as session:
            repo = BaseRepository(session, Categoria)

            # add
            cat = Categoria(nombre="Pizzas", descripcion="Pizzas caseras", activo=True)
            added = repo.add(cat)
            session.commit()
            self.assertIsNotNone(added.id)

            # get_by_id
            found = repo.get_by_id(added.id)
            self.assertIsNotNone(found)
            self.assertEqual(found.nombre, "Pizzas")

            # get_all
            cat2 = Categoria(nombre="Bebidas", activo=True)
            repo.add(cat2)
            session.commit()
            all_cats = repo.get_all()
            self.assertEqual(len(all_cats), 2)

            # delete
            repo.delete(cat2)
            session.commit()
            self.assertEqual(len(repo.get_all()), 1)

    def test_02_unit_of_work_commit_on_success(self):
        """Verifica que UnitOfWork hace commit automático al salir sin excepción."""
        uow = UnitOfWork(session_maker=self.session_factory)

        with uow:
            cat = Categoria(nombre="Burgers", activo=True)
            uow.session.add(cat)
            # No llamamos a session.commit(), __exit__ debe hacerlo

        # Comprobar en una sesión limpia que los datos se persistieron
        with Session(self.engine) as verify_session:
            saved = verify_session.exec(
                select(Categoria).where(Categoria.nombre == "Burgers")
            ).first()
            self.assertIsNotNone(saved)
            self.assertEqual(saved.nombre, "Burgers")

    def test_03_unit_of_work_rollback_on_exception(self):
        """Verifica que UnitOfWork hace rollback automático si ocurre una excepción dentro del bloque."""
        uow = UnitOfWork(session_maker=self.session_factory)

        try:
            with uow:
                cat = Categoria(nombre="Pastas", activo=True)
                uow.session.add(cat)
                raise RuntimeError("Error simulado de negocio")
        except RuntimeError:
            pass

        # Comprobar en una sesión limpia que NO se persistió nada
        with Session(self.engine) as verify_session:
            saved = verify_session.exec(
                select(Categoria).where(Categoria.nombre == "Pastas")
            ).first()
            self.assertIsNone(saved)

    def test_04_pedido_service_transaccional_rollback_stock(self):
        """Verifica que si falla la creación del pedido, el stock NO se descuenta y el pedido no existe."""
        # Setup inicial: usuario, categoría y producto con stock 5
        with Session(self.engine) as s:
            u = Usuario(
                username="cliente1",
                full_name="Cliente Uno",
                email="cliente1@test.com",
                hashed_password="hash",
                role="user",
                disabled=False,
            )
            s.add(u)
            cat = Categoria(nombre="Comidas", activo=True)
            s.add(cat)
            s.commit()
            s.refresh(u)
            s.refresh(cat)

            prod = Producto(
                categoria_id=cat.id,
                nombre="Promo Burger",
                precio_base=5000.0,
                stock=5,
                disponible=True,
                activo=True,
            )
            s.add(prod)
            s.commit()
            s.refresh(prod)
            usuario_id = u.id
            producto_id = prod.id

        # PedidoUnitOfWork conectado a nuestro engine
        pedido_uow = PedidoUnitOfWork(session_maker=self.session_factory)
        service = PedidoService(uow=pedido_uow)

        # Intento de comprar 10 unidades cuando solo hay 5 (StockInsuficiente)
        pedido_invalido = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=producto_id, cantidad=10)],
            forma_pago="EFECTIVO",
            direccion_entrega="Av. Libertador 1234",
        )

        with self.assertRaises(StockInsuficiente):
            service.crear_pedido(usuario_id=usuario_id, data=pedido_invalido)

        # Comprobar que el stock sigue intacto en 5 y ningún pedido fue creado
        with Session(self.engine) as verify_session:
            p = verify_session.get(Producto, producto_id)
            self.assertEqual(p.stock, 5)

            pedidos = verify_session.exec(select(Pedido)).all()
            self.assertEqual(len(pedidos), 0)

    def test_05_pedido_service_transaccional_exito(self):
        """Verifica que cuando el pedido tiene éxito, descuenta el stock y persiste todo en una sola transacción."""
        with Session(self.engine) as s:
            u = Usuario(
                username="cliente2",
                full_name="Cliente Dos",
                email="cliente2@test.com",
                hashed_password="hash",
                role="user",
                disabled=False,
            )
            s.add(u)
            cat = Categoria(nombre="Bebidas", activo=True)
            s.add(cat)
            s.commit()
            s.refresh(u)
            s.refresh(cat)

            prod = Producto(
                categoria_id=cat.id,
                nombre="Agua Mineral",
                precio_base=1500.0,
                stock=10,
                disponible=True,
                activo=True,
            )
            s.add(prod)
            s.commit()
            s.refresh(prod)
            usuario_id = u.id
            producto_id = prod.id

        pedido_uow = PedidoUnitOfWork(session_maker=self.session_factory)
        service = PedidoService(uow=pedido_uow)

        pedido_valido = PedidoCreate(
            items=[ItemPedidoCreate(producto_id=producto_id, cantidad=3)],
            forma_pago="TRANSFERENCIA",
            direccion_entrega="San Martín 999",
        )

        read_dto = service.crear_pedido(usuario_id=usuario_id, data=pedido_valido)

        # El DTO de salida se devuelve dentro del bloque
        self.assertEqual(read_dto.total, 4500.0)
        self.assertEqual(len(read_dto.items), 1)
        self.assertEqual(read_dto.items[0].subtotal, 4500.0)

        # Comprobar que en la base el stock se redujo de 10 a 7
        with Session(self.engine) as verify_session:
            p = verify_session.get(Producto, producto_id)
            self.assertEqual(p.stock, 7)

            pedido_db = verify_session.get(Pedido, read_dto.id)
            self.assertIsNotNone(pedido_db)
            self.assertEqual(pedido_db.total, 4500.0)

    def test_06_ningun_service_ni_router_llama_a_commit(self):
        """Verifica estáticamente que ningún archivo de Service ni Router llame a session.commit()."""
        import app.modules.categorias.service as cat_svc
        import app.modules.productos.service as prod_svc
        import app.modules.pedidos.service as ped_svc
        import app.modules.categorias.router as cat_rtr
        import app.modules.productos.router as prod_rtr
        import app.modules.pedidos.router as ped_rtr

        modules_to_check = [
            cat_svc,
            prod_svc,
            ped_svc,
            cat_rtr,
            prod_rtr,
            ped_rtr,
        ]

        for mod in modules_to_check:
            source = inspect.getsource(mod)
            self.assertNotIn(
                ".commit()",
                source,
                f"El archivo {mod.__name__} no debe contener llamadas a .commit()!",
            )

    def test_07_routers_no_abren_unit_of_work(self):
        """Verifica estáticamente que los Routers no abran el UnitOfWork (with uow)."""
        import app.modules.categorias.router as cat_rtr
        import app.modules.productos.router as prod_rtr
        import app.modules.pedidos.router as ped_rtr

        routers_to_check = [cat_rtr, prod_rtr, ped_rtr]

        for mod in routers_to_check:
            source = inspect.getsource(mod)
            self.assertNotIn(
                "UnitOfWork",
                source,
                f"El router {mod.__name__} no debe importar ni abrir UnitOfWork!",
            )


if __name__ == "__main__":
    unittest.main()
