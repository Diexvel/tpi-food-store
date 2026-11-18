from typing import Optional
from app.modules.categorias.schemas import CategoriaRead
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    pass


class CategoriaNoEncontrada(Exception):
    pass


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork = None):
        self.uow = uow or ProductoUnitOfWork()

    def _to_read(self, producto: Producto) -> ProductoRead:
        cat_read = None
        if producto.categoria:
            cat_read = CategoriaRead.model_validate(producto.categoria)
        read_obj = ProductoRead.model_validate(producto)
        read_obj.categoria = cat_read
        return read_obj

    def list_paginado(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
        disponible: Optional[bool] = None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, items = uow.productos.search(
                skip=skip,
                limit=limit,
                search_term=search,
                categoria_id=categoria_id,
                disponible=disponible,
                solo_activos=True,
            )
            return ProductosPaginados(
                total=total,
                items=[self._to_read(p) for p in items],
            )

    def get_by_id(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            producto = uow.productos.get_by_id(producto_id)
            if not producto or not producto.activo:
                raise ProductoNoEncontrado()
            return self._to_read(producto)

    def create(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            categoria = uow.categorias.get_by_id(data.categoria_id)
            if not categoria or not categoria.activo:
                raise CategoriaNoEncontrada()

            producto = Producto(
                nombre=data.nombre,
                descripcion=data.descripcion,
                precio_base=data.precio_base,
                imagen_url=data.imagen_url,
                stock=data.stock,
                disponible=data.disponible,
                categoria_id=data.categoria_id,
                activo=True,
            )
            uow.productos.add(producto)
            return self._to_read(producto)

    def update(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = uow.productos.get_by_id(producto_id)
            if not producto or not producto.activo:
                raise ProductoNoEncontrado()

            if data.categoria_id is not None:
                categoria = uow.categorias.get_by_id(data.categoria_id)
                if not categoria or not categoria.activo:
                    raise CategoriaNoEncontrada()
                producto.categoria_id = data.categoria_id
                producto.categoria = categoria

            if data.nombre is not None:
                producto.nombre = data.nombre
            if data.descripcion is not None:
                producto.descripcion = data.descripcion
            if data.precio_base is not None:
                producto.precio_base = data.precio_base
            if data.imagen_url is not None:
                producto.imagen_url = data.imagen_url
            if data.stock is not None:
                producto.stock = data.stock
            if data.disponible is not None:
                producto.disponible = data.disponible

            uow.productos.add(producto)
            return self._to_read(producto)

    def update_stock(self, producto_id: int, data: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = uow.productos.get_by_id(producto_id)
            if not producto or not producto.activo:
                raise ProductoNoEncontrado()

            producto.stock = data.stock
            producto.disponible = data.disponible
            uow.productos.add(producto)
            return self._to_read(producto)

    def delete(self, producto_id: int) -> None:
        with self.uow as uow:
            producto = uow.productos.get_by_id(producto_id)
            if not producto or not producto.activo:
                raise ProductoNoEncontrado()
            producto.activo = False
            uow.productos.add(producto)
