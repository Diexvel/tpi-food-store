from typing import List
from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork = None):
        self.uow = uow or CategoriaUnitOfWork()

    def list_activas(self) -> List[CategoriaRead]:
        with self.uow as uow:
            categorias = uow.categorias.get_activas()
            return [CategoriaRead.model_validate(c) for c in categorias]

    def get_by_id(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria or not categoria.activo:
                raise CategoriaNoEncontrada()
            return CategoriaRead.model_validate(categoria)

    def create(self, data: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            existing = uow.categorias.get_by_nombre(data.nombre)
            if existing:
                raise NombreDuplicado()
            categoria = Categoria(
                nombre=data.nombre,
                descripcion=data.descripcion,
                activo=True,
            )
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def update(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria or not categoria.activo:
                raise CategoriaNoEncontrada()

            if data.nombre is not None and data.nombre != categoria.nombre:
                existing = uow.categorias.get_by_nombre(data.nombre)
                if existing and existing.id != categoria_id:
                    raise NombreDuplicado()
                categoria.nombre = data.nombre

            if data.descripcion is not None:
                categoria.descripcion = data.descripcion

            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def delete(self, categoria_id: int) -> None:
        with self.uow as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria or not categoria.activo:
                raise CategoriaNoEncontrada()
            categoria.activo = False
            uow.categorias.add(categoria)
