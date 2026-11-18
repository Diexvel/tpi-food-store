from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlmodel import Session, select
from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(session, Producto)

    def search(
        self,
        skip: int = 0,
        limit: int = 20,
        search_term: Optional[str] = None,
        categoria_id: Optional[int] = None,
        disponible: Optional[bool] = None,
        solo_activos: bool = True,
    ) -> Tuple[int, List[Producto]]:
        query = select(Producto)
        count_query = select(func.count(Producto.id))

        if solo_activos:
            query = query.where(Producto.activo == True)
            count_query = count_query.where(Producto.activo == True)

        if search_term:
            filter_search = func.lower(Producto.nombre).contains(search_term.lower())
            query = query.where(filter_search)
            count_query = count_query.where(filter_search)

        if categoria_id is not None:
            query = query.where(Producto.categoria_id == categoria_id)
            count_query = count_query.where(Producto.categoria_id == categoria_id)

        if disponible is not None:
            query = query.where(Producto.disponible == disponible)
            count_query = count_query.where(Producto.disponible == disponible)

        total = self.session.exec(count_query).one()
        items = list(self.session.exec(query.offset(skip).limit(limit)).all())
        return total, items
