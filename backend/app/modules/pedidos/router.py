from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.deps import get_current_active_user, require_role
from app.modules.pedidos.schemas import (
    CambioEstado,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
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
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def get_pedido_service() -> PedidoService:
    return PedidoService()


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    data: PedidoCreate,
    current_user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.crear_pedido(current_user.id, data)
    except ProductoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (StockInsuficiente, ProductoNoDisponible, ProductoRepetido) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=PedidosPaginados)
def list_pedidos(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    estado: Optional[str] = Query(default=None),
    current_user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    usuario_id = None if current_user.role == "admin" else current_user.id
    return service.list_pedidos(
        usuario_id=usuario_id,
        skip=skip,
        limit=limit,
        estado=estado,
    )


@router.get("/resumen", response_model=ResumenPedidos)
def get_resumen(
    current_admin: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.get_resumen()


@router.get("/{id}", response_model=PedidoRead)
def get_pedido(
    id: int,
    current_user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.get_by_id(id, current_user.id, current_user.role)
    except PedidoNoEncontrado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    except PedidoAjeno:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene acceso a este pedido")


@router.patch("/{id}/estado", response_model=PedidoRead)
def cambiar_estado_pedido(
    id: int,
    data: CambioEstado,
    current_admin: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.cambiar_estado(id, data.estado)
    except PedidoNoEncontrado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    except TransicionInvalida as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{id}/cancelar", response_model=PedidoRead)
def cancelar_pedido_cliente(
    id: int,
    current_user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.cancelar_pedido_cliente(id, current_user.id)
    except PedidoNoEncontrado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    except PedidoAjeno:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede cancelar un pedido ajeno")
    except TransicionInvalida as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
