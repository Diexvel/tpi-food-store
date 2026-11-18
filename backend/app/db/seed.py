from sqlmodel import Session, select
from app.core.database import create_all_tables, engine
from app.core.security import get_password_hash
from app.modules.categorias.models import Categoria
from app.modules.pedidos.models import DetallePedido, Pedido  # noqa: F401
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario


def seed_database():
    print("Inicializando base de datos y creando tablas...")
    create_all_tables()

    with Session(engine) as session:
        # 1. Crear usuario admin si no existe
        admin = session.exec(select(Usuario).where(Usuario.username == "admin")).first()
        if not admin:
            admin = Usuario(
                username="admin",
                full_name="Administrador",
                email="admin@foodstore.com",
                hashed_password=get_password_hash("Admin1234!"),
                role="admin",
                disabled=False,
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print("✓ Usuario administrador creado: admin / Admin1234!")
        else:
            print("• Usuario administrador ya existe.")

        # 2. Categorías base
        categorias_data = [
            {
                "nombre": "Hamburguesas",
                "descripcion": "Hamburguesas gourmet y smash con papas",
                "activo": True,
            },
            {
                "nombre": "Pizzas",
                "descripcion": "Pizzas artesanales estilo napolitano",
                "activo": True,
            },
            {
                "nombre": "Bebidas",
                "descripcion": "Gaseosas, aguas y cervezas artesanales",
                "activo": True,
            },
            {
                "nombre": "Postres",
                "descripcion": "Postres caseros y dulces",
                "activo": True,
            },
        ]

        categorias_map = {}
        for cat_data in categorias_data:
            cat = session.exec(
                select(Categoria).where(Categoria.nombre == cat_data["nombre"])
            ).first()
            if not cat:
                cat = Categoria(**cat_data)
                session.add(cat)
                session.commit()
                session.refresh(cat)
                print(f"✓ Categoría creada: {cat.nombre}")
            else:
                print(f"• Categoría ya existe: {cat.nombre}")
            categorias_map[cat.nombre] = cat.id

        # 3. Productos base (al menos 8 con stock)
        productos_data = [
            {
                "nombre": "Hamburguesa Clásica",
                "descripcion": "Medallón de carne 180g, lechuga, tomate, queso cheddar y salsa especial",
                "precio_base": 8500.0,
                "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
                "stock": 25,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Hamburguesas",
            },
            {
                "nombre": "Doble Bacon Burger",
                "descripcion": "Doble medallón de 120g smash, panceta crocante y cheddar fundido",
                "precio_base": 10500.0,
                "imagen_url": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90",
                "stock": 18,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Hamburguesas",
            },
            {
                "nombre": "Pizza Margherita",
                "descripcion": "Salsa de tomate casera, mozzarella fior di latte y albahaca fresca",
                "precio_base": 9200.0,
                "imagen_url": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143",
                "stock": 30,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Pizzas",
            },
            {
                "nombre": "Pizza Pepperoni Especial",
                "descripcion": "Mozzarella premium, abundante pepperoni italiano y orégano",
                "precio_base": 11500.0,
                "imagen_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e",
                "stock": 20,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Pizzas",
            },
            {
                "nombre": "Pizza Cuatro Quesos",
                "descripcion": "Mozzarella, provolone, gorgonzola y parmesano reggiano",
                "precio_base": 12000.0,
                "imagen_url": "https://images.unsplash.com/photo-1573821663912-569905455b1c",
                "stock": 15,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Pizzas",
            },
            {
                "nombre": "Coca Cola 500ml",
                "descripcion": "Bebida gaseosa refrescante en botella de 500ml",
                "precio_base": 2500.0,
                "imagen_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
                "stock": 50,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Bebidas",
            },
            {
                "nombre": "Cerveza Artesanal IPA 473ml",
                "descripcion": "Cerveza con marcado aroma a lúpulo y amargor equilibrado",
                "precio_base": 4200.0,
                "imagen_url": "https://images.unsplash.com/photo-1535958636474-b021ee887b13",
                "stock": 35,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Bebidas",
            },
            {
                "nombre": "Tiramisú Tradicional",
                "descripcion": "Clásico postre italiano con vainillas al café, mascarpone y cacao amargo",
                "precio_base": 4800.0,
                "imagen_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9",
                "stock": 14,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Postres",
            },
            {
                "nombre": "Volcán de Chocolate con Helado",
                "descripcion": "Bizcochuelo tibio relleno de chocolate fundido con bocha de crema americana",
                "precio_base": 5200.0,
                "imagen_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
                "stock": 12,
                "disponible": True,
                "activo": True,
                "categoria_nombre": "Postres",
            },
        ]

        for prod_data in productos_data:
            cat_nombre = prod_data.pop("categoria_nombre")
            prod = session.exec(
                select(Producto).where(Producto.nombre == prod_data["nombre"])
            ).first()
            if not prod:
                categoria_id = categorias_map[cat_nombre]
                prod = Producto(categoria_id=categoria_id, **prod_data)
                session.add(prod)
                session.commit()
                session.refresh(prod)
                print(f"✓ Producto creado: {prod.nombre} (Stock: {prod.stock})")
            else:
                print(f"• Producto ya existe: {prod.nombre}")

    print("\n¡Seed completado con éxito!")


if __name__ == "__main__":
    seed_database()
