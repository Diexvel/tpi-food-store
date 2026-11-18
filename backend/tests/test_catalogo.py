import unittest
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session, create_engine, select

from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaRead,
    CategoriaUpdate,
)
from app.modules.categorias.service import (
    CategoriaNoEncontrada,
    CategoriaService,
    NombreDuplicado,
)
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import (
    CategoriaNoEncontrada as CatNotFoundProd,
    ProductoNoEncontrado,
    ProductoService,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class TestCatalogoAPI(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        SQLModel.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine, class_=Session)

        self.cat_uow = CategoriaUnitOfWork(session_maker=self.session_factory)
        self.cat_service = CategoriaService(uow=self.cat_uow)

        self.prod_uow = ProductoUnitOfWork(session_maker=self.session_factory)
        self.prod_service = ProductoService(uow=self.prod_uow)

    def test_01_categoria_crud_completo(self):
        """Creación, lectura activa, detalle, actualización parcial y baja lógica 204."""
        # 1. Create
        cat = self.cat_service.create(
            CategoriaCreate(nombre="Pizzas", descripcion="Pizzas al horno")
        )
        self.assertEqual(cat.nombre, "Pizzas")
        self.assertTrue(cat.activo)

        # 2. Get by ID
        found = self.cat_service.get_by_id(cat.id)
        self.assertEqual(found.id, cat.id)
        self.assertEqual(found.nombre, "Pizzas")

        # 3. Update parcial (solo descripción)
        updated = self.cat_service.update(
            cat.id, CategoriaUpdate(descripcion="Pizzas a la leña")
        )
        self.assertEqual(updated.nombre, "Pizzas")
        self.assertEqual(updated.descripcion, "Pizzas a la leña")

        # 4. List activas
        lista = self.cat_service.list_activas()
        self.assertEqual(len(lista), 1)

        # 5. Delete (Baja lógica)
        self.cat_service.delete(cat.id)

        # Verificar que ya no aparece en listado público
        self.assertEqual(len(self.cat_service.list_activas()), 0)

        # Verificar que get_by_id da 404 (CategoriaNoEncontrada)
        with self.assertRaises(CategoriaNoEncontrada):
            self.cat_service.get_by_id(cat.id)

        # Verificar que el registro sigue existiendo en BD con activo=False (sin borrado físico)
        with self.session_factory() as s:
            db_cat = s.get(Categoria, cat.id)
            self.assertIsNotNone(db_cat)
            self.assertFalse(db_cat.activo)

    def test_02_categoria_unicidad_nombre_y_baja_logica(self):
        """La baja lógica de una categoría NO libera su nombre único (409 NombreDuplicado)."""
        cat = self.cat_service.create(CategoriaCreate(nombre="Bebidas"))
        self.cat_service.delete(cat.id)

        # Intentar crear otra categoría con el mismo nombre debe fallar con 409
        with self.assertRaises(NombreDuplicado):
            self.cat_service.create(CategoriaCreate(nombre="Bebidas"))

    def test_03_producto_create_y_validaciones_categoria(self):
        """Crear producto valida que la categoría exista y esté activa (404 si inactiva/inexistente)."""
        cat_activa = self.cat_service.create(CategoriaCreate(nombre="Hamburguesas"))
        cat_inactiva = self.cat_service.create(CategoriaCreate(nombre="Helados"))
        self.cat_service.delete(cat_inactiva.id)

        # Categoría activa -> éxito
        prod = self.prod_service.create(
            ProductoCreate(
                nombre="Cheeseburger",
                precio_base=8500.0,
                stock=20,
                disponible=True,
                categoria_id=cat_activa.id,
            )
        )
        self.assertEqual(prod.nombre, "Cheeseburger")
        self.assertEqual(prod.categoria.id, cat_activa.id)

        # Categoría inexistente -> 404
        with self.assertRaises(CatNotFoundProd):
            self.prod_service.create(
                ProductoCreate(
                    nombre="Prod X",
                    precio_base=1000.0,
                    stock=5,
                    categoria_id=9999,
                )
            )

        # Categoría inactiva -> 404
        with self.assertRaises(CatNotFoundProd):
            self.prod_service.create(
                ProductoCreate(
                    nombre="Helado Vainilla",
                    precio_base=2000.0,
                    stock=5,
                    categoria_id=cat_inactiva.id,
                )
            )

    def test_04_producto_listado_paginado_filtros_y_busqueda(self):
        """Listado paginado con búsqueda case-insensitive, filtro por categoría y disponible."""
        cat1 = self.cat_service.create(CategoriaCreate(nombre="Minutas"))
        cat2 = self.cat_service.create(CategoriaCreate(nombre="Bebidas"))

        # Crear productos
        self.prod_service.create(
            ProductoCreate(
                nombre="Milanesa Napolitana",
                precio_base=9500.0,
                stock=15,
                disponible=True,
                categoria_id=cat1.id,
            )
        )
        self.prod_service.create(
            ProductoCreate(
                nombre="Milanesa Suiza",
                precio_base=10000.0,
                stock=10,
                disponible=False,
                categoria_id=cat1.id,
            )
        )
        self.prod_service.create(
            ProductoCreate(
                nombre="Papas Fritas",
                precio_base=4000.0,
                stock=30,
                disponible=True,
                categoria_id=cat1.id,
            )
        )
        self.prod_service.create(
            ProductoCreate(
                nombre="Cerveza Rubia",
                precio_base=3500.0,
                stock=25,
                disponible=True,
                categoria_id=cat2.id,
            )
        )

        # 1. Paginación: skip=0, limit=2
        res1 = self.prod_service.list_paginado(skip=0, limit=2)
        self.assertEqual(res1.total, 4)
        self.assertEqual(len(res1.items), 2)

        # 2. Búsqueda case-insensitive: search="MILANESA"
        res_search = self.prod_service.list_paginado(search="MILANESA")
        self.assertEqual(res_search.total, 2)
        self.assertTrue(all("Milanesa" in p.nombre for p in res_search.items))

        # 3. Filtro por categoría: categoria_id=cat2.id
        res_cat = self.prod_service.list_paginado(categoria_id=cat2.id)
        self.assertEqual(res_cat.total, 1)
        self.assertEqual(res_cat.items[0].nombre, "Cerveza Rubia")

        # 4. Filtro por disponibilidad: disponible=False
        res_disp = self.prod_service.list_paginado(disponible=False)
        self.assertEqual(res_disp.total, 1)
        self.assertEqual(res_disp.items[0].nombre, "Milanesa Suiza")

    def test_05_producto_update_stock_y_patch(self):
        """PATCH de stock y disponible."""
        cat = self.cat_service.create(CategoriaCreate(nombre="Cafetería"))
        prod = self.prod_service.create(
            ProductoCreate(
                nombre="Café Espresso",
                precio_base=2000.0,
                stock=5,
                disponible=True,
                categoria_id=cat.id,
            )
        )

        # Actualizar stock y disponible
        updated = self.prod_service.update_stock(
            prod.id, ProductoStockUpdate(stock=0, disponible=False)
        )
        self.assertEqual(updated.stock, 0)
        self.assertFalse(updated.disponible)

    def test_06_producto_baja_logica(self):
        """Baja lógica de producto: activo=False, responde 404 a operaciones posteriores."""
        cat = self.cat_service.create(CategoriaCreate(nombre="Postres"))
        prod = self.prod_service.create(
            ProductoCreate(
                nombre="Flan Casero",
                precio_base=3000.0,
                stock=8,
                disponible=True,
                categoria_id=cat.id,
            )
        )

        # Delete
        self.prod_service.delete(prod.id)

        # Ya no aparece en listado activo
        res = self.prod_service.list_paginado()
        self.assertEqual(res.total, 0)

        # get_by_id responde 404
        with self.assertRaises(ProductoNoEncontrado):
            self.prod_service.get_by_id(prod.id)

        # update responde 404
        with self.assertRaises(ProductoNoEncontrado):
            self.prod_service.update(prod.id, ProductoUpdate(nombre="Nuevo Flan"))

        # update_stock responde 404
        with self.assertRaises(ProductoNoEncontrado):
            self.prod_service.update_stock(
                prod.id, ProductoStockUpdate(stock=10, disponible=True)
            )

        # delete repetido responde 404
        with self.assertRaises(ProductoNoEncontrado):
            self.prod_service.delete(prod.id)

        # El registro persiste en BD con activo=False (sin borrado físico)
        with self.session_factory() as s:
            p_db = s.get(Producto, prod.id)
            self.assertIsNotNone(p_db)
            self.assertFalse(p_db.activo)


if __name__ == "__main__":
    unittest.main()
