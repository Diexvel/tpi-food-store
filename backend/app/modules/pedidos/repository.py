from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlmodel import Session, select
from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    def list_by_usuario(
        self,
        usuario_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
        estado: Optional[str] = None,
    ) -> Tuple[int, List[Pedido]]:
        query = select(Pedido)
        count_query = select(func.count(Pedido.id))

        if usuario_id is not None:
            query = query.where(Pedido.usuario_id == usuario_id)
            count_query = count_query.where(Pedido.usuario_id == usuario_id)

        if estado:
            query = query.where(Pedido.estado == estado)
            count_query = count_query.where(Pedido.estado == estado)

        query = query.order_by(Pedido.created_at.desc()).offset(skip).limit(limit)

        total = self.session.exec(count_query).one()
        items = list(self.session.exec(query).all())
        return total, items

    def count_by_estado(self) -> dict:
        statement = select(Pedido.estado, func.count(Pedido.id)).group_by(Pedido.estado)
        results = self.session.exec(statement).all()
        counts = {estado: count for estado, count in results}
        return counts

    def get_resumen(self) -> dict:
        counts = self.count_by_estado()
        pendientes = counts.get("PENDIENTE", 0)
        en_preparacion = counts.get("EN_PREPARACION", 0)
        entregados = counts.get("ENTREGADO", 0)
        cancelados = counts.get("CANCELADO", 0)

        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        pedidos_hoy_stmt = select(func.count(Pedido.id)).where(Pedido.created_at >= start_of_day)
        pedidos_hoy = self.session.exec(pedidos_hoy_stmt).one() or 0

        ingresos_stmt = select(func.sum(Pedido.total)).where(Pedido.estado == "ENTREGADO")
        ingresos_entregados = self.session.exec(ingresos_stmt).one() or 0.0

        return {
            "pendientes": pendientes,
            "en_preparacion": en_preparacion,
            "entregados": entregados,
            "cancelados": cancelados,
            "pedidos_hoy": pedidos_hoy,
            "ingresos_entregados": float(ingresos_entregados),
        }

    def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle
