import unittest
from datetime import datetime, timezone
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session, create_engine, select

from app.modules.usuarios.models import Usuario
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.pedidos.models import Pedido, DetallePedido


class TestModeloDatos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Base de datos en memoria para pruebas de modelos
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        SQLModel.metadata.create_all(cls.engine)
        cls.SessionLocal = sessionmaker(bind=cls.engine, class_=Session)

    def test_01_cinco_entidades_table_true(self):
        """Verifica que las 5 entidades tengan table=True y sus tablas creadas."""
        tablas = SQLModel.metadata.tables.keys()
        self.assertIn("usuario", tablas)
        self.assertIn("categoria", tablas)
        self.assertIn("producto", tablas)
        self.assertIn("pedido", tablas)
        self.assertIn("detallepedido", tablas)

    def test_02_relaciones_exactas_y_bidireccionales(self):
        """Verifica los nombres exactos y bidireccionalidad de las relaciones."""
        with self.SessionLocal() as session:
            # 1. Usuario
            usuario = Usuario(
                username="testuser",
                full_name="Test User",
                email="test@test.com",
                hashed_password="hashed_pw_test",
                role="user",
                disabled=False,
            )
            session.add(usuario)
            session.commit()
            session.refresh(usuario)

            # 2. Categoria
            categoria = Categoria(
                nombre="Empanadas",
                descripcion="Empanadas tradicionales",
                activo=True,
            )
            session.add(categoria)
            session.commit()
            session.refresh(categoria)

            # 3. Producto
            producto = Producto(
                categoria_id=categoria.id,
                nombre="Empanada de Carne",
                descripcion="Carne cortada a cuchillo",
                precio_base=1800.0,
                stock=50,
                disponible=True,
                activo=True,
            )
            session.add(producto)
            session.commit()
            session.refresh(producto)

            # Relación Categoria 1:N Producto (Categoria.productos y Producto.categoria)
            self.assertEqual(len(categoria.productos), 1)
            self.assertEqual(categoria.productos[0].id, producto.id)
            self.assertEqual(producto.categoria.id, categoria.id)
            self.assertEqual(producto.categoria.nombre, "Empanadas")

            # 4. Pedido
            pedido = Pedido(
                usuario_id=usuario.id,
                estado="PENDIENTE",
                forma_pago="EFECTIVO",
                direccion_entrega="Calle Falsa 123",
                total=3600.0,
            )
            session.add(pedido)
            session.commit()
            session.refresh(pedido)

            # Relación Usuario 1:N Pedido (Usuario.pedidos y Pedido.usuario)
            self.assertEqual(len(usuario.pedidos), 1)
            self.assertEqual(usuario.pedidos[0].id, pedido.id)
            self.assertEqual(pedido.usuario.id, usuario.id)

            # 5. DetallePedido
            detalle = DetallePedido(
                pedido_id=pedido.id,
                producto_id=producto.id,
                cantidad=2,
                nombre_producto=producto.nombre,
                precio_unitario=producto.precio_base,
                subtotal=producto.precio_base * 2,
            )
            session.add(detalle)
            session.commit()
            session.refresh(detalle)
            session.refresh(pedido)
            session.refresh(producto)

            # Relación Pedido 1:N DetallePedido (Pedido.items y DetallePedido.pedido)
            self.assertEqual(len(pedido.items), 1)
            self.assertEqual(pedido.items[0].id, detalle.id)
            self.assertEqual(detalle.pedido.id, pedido.id)

            # Relación Producto 1:N DetallePedido (Producto.detalles y DetallePedido.producto)
            self.assertEqual(len(producto.detalles), 1)
            self.assertEqual(producto.detalles[0].id, detalle.id)
            self.assertEqual(detalle.producto.id, producto.id)

    def test_03_copia_nombre_y_precio_inmutables(self):
        """DetallePedido guarda copia de nombre y precio; cambios en Producto no alteran la línea."""
        with self.SessionLocal() as session:
            usuario = session.exec(select(Usuario)).first()
            cat = session.exec(select(Categoria)).first()

            prod = Producto(
                categoria_id=cat.id,
                nombre="Lomito Completo",
                precio_base=12000.0,
                stock=10,
                disponible=True,
                activo=True,
            )
            session.add(prod)
            session.commit()
            session.refresh(prod)

            pedido = Pedido(
                usuario_id=usuario.id,
                estado="PENDIENTE",
                forma_pago="TRANSFERENCIA",
                direccion_entrega="Belgrano 456",
                total=12000.0,
            )
            session.add(pedido)
            session.commit()
            session.refresh(pedido)

            detalle = DetallePedido(
                pedido_id=pedido.id,
                producto_id=prod.id,
                cantidad=1,
                nombre_producto=prod.nombre,
                precio_unitario=prod.precio_base,
                subtotal=12000.0,
            )
            session.add(detalle)
            session.commit()
            session.refresh(detalle)

            # Si el producto sube de precio y cambia de nombre en el catálogo:
            prod.nombre = "Lomito Ultra VIP"
            prod.precio_base = 16000.0
            session.add(prod)
            session.commit()
            session.refresh(detalle)

            # La línea del pedido histórico DEBE mantener el nombre y precio original
            self.assertEqual(detalle.nombre_producto, "Lomito Completo")
            self.assertEqual(detalle.precio_unitario, 12000.0)
            self.assertEqual(detalle.subtotal, 12000.0)

    def test_04_baja_logica(self):
        """Baja lógica mediante campos booleanos (activo / disabled)."""
        with self.SessionLocal() as session:
            cat = Categoria(nombre="Sandwiches", activo=True)
            session.add(cat)
            session.commit()
            session.refresh(cat)
            self.assertTrue(cat.activo)

            # Baja lógica categoría
            cat.activo = False
            session.add(cat)
            session.commit()
            session.refresh(cat)
            self.assertFalse(cat.activo)

            # Baja lógica usuario
            user = Usuario(
                username="user_activo",
                full_name="Usuario Activo",
                email="activo@test.com",
                hashed_password="pwd",
                role="user",
                disabled=False,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            self.assertFalse(user.disabled)

            user.disabled = True
            session.add(user)
            session.commit()
            session.refresh(user)
            self.assertTrue(user.disabled)


if __name__ == "__main__":
    unittest.main()
