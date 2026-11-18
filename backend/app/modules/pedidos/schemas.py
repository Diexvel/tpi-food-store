from datetime import datetime
from typing import List, Optional
from pydantic import field_validator
from sqlmodel import Field, SQLModel


class ItemPedidoCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    items: List[ItemPedidoCreate] = Field(min_length=1)
    forma_pago: str
    direccion_entrega: str = Field(min_length=5, max_length=200)
    notas: Optional[str] = None

    @field_validator("forma_pago")
    @classmethod
    def validate_forma_pago(cls, v: str) -> str:
        if v not in ("EFECTIVO", "TRANSFERENCIA"):
            raise ValueError("forma_pago debe ser 'EFECTIVO' o 'TRANSFERENCIA'")
        return v


class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: Optional[str] = None
    total: float
    created_at: datetime
    updated_at: datetime
    items: List[DetallePedidoRead] = []


class PedidosPaginados(SQLModel):
    total: int
    items: List[PedidoRead]


class CambioEstado(SQLModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        estados_validos = ("PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO")
        if v not in estados_validos:
            raise ValueError(f"Estado inválido. Debe ser uno de {estados_validos}")
        return v


class ResumenPedidos(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
