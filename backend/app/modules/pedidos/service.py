from datetime import datetime, timezone
from typing import List, Optional
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    DetallePedidoRead,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork


class PedidoNoEncontrado(Exception):
    pass


class ProductoNoEncontrado(Exception):
    pass


class ProductoNoDisponible(Exception):
    pass


class StockInsuficiente(Exception):
    pass


class ProductoRepetido(Exception):
    pass


class PedidoAjeno(Exception):
    pass


class TransicionInvalida(Exception):
    pass


TRANSICIONES_VALIDAS = {
    "PENDIENTE": ["EN_PREPARACION", "CANCELADO"],
    "EN_PREPARACION": ["ENTREGADO", "CANCELADO"],
    "ENTREGADO": [],
    "CANCELADO": [],
}


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork = None):
        self.uow = uow or PedidoUnitOfWork()

    def _to_read(self, pedido: Pedido) -> PedidoRead:
        items_read = [
            DetallePedidoRead(
                producto_id=item.producto_id,
                nombre_producto=item.nombre_producto,
                precio_unitario=item.precio_unitario,
                cantidad=item.cantidad,
                subtotal=item.subtotal,
            )
            for item in pedido.items
        ]
        return PedidoRead(
            id=pedido.id,
            usuario_id=pedido.usuario_id,
            estado=pedido.estado,
            forma_pago=pedido.forma_pago,
            direccion_entrega=pedido.direccion_entrega,
            notas=pedido.notas,
            total=pedido.total,
            created_at=pedido.created_at,
            updated_at=pedido.updated_at,
            items=items_read,
        )

    def crear_pedido(self, usuario_id: int, data: PedidoCreate) -> PedidoRead:
        # Validar productos no repetidos (RN-01)
        product_ids = [item.producto_id for item in data.items]
        if len(product_ids) != len(set(product_ids)):
            raise ProductoRepetido("No se pueden repetir productos en el pedido")

        with self.uow as uow:
            pedido = Pedido(
                usuario_id=usuario_id,
                estado="PENDIENTE",
                forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega,
                notas=data.notas,
                total=0.0,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            uow.pedidos.add(pedido)

            total_acumulado = 0.0
            for item in data.items:
                producto = uow.productos.get_by_id(item.producto_id)
                if not producto or not producto.activo:
                    raise ProductoNoEncontrado("Producto inexistente o inactivo")
                if not producto.disponible:
                    raise ProductoNoDisponible("El producto no está disponible para la venta")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(f"Stock insuficiente para {producto.nombre}")

                # Descontar stock
                producto.stock -= item.cantidad
                uow.productos.add(producto)

                subtotal = producto.precio_base * item.cantidad
                total_acumulado += subtotal

                detalle = DetallePedido(
                    pedido=pedido,
                    pedido_id=pedido.id,
                    producto_id=producto.id,
                    cantidad=item.cantidad,
                    nombre_producto=producto.nombre,
                    precio_unitario=producto.precio_base,
                    subtotal=subtotal,
                )
                uow.pedidos.add_detalle(detalle)

            pedido.total = total_acumulado
            uow.pedidos.add(pedido)
            return self._to_read(pedido)

    def list_pedidos(
        self,
        usuario_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
        estado: Optional[str] = None,
    ) -> PedidosPaginados:
        with self.uow as uow:
            total, items = uow.pedidos.list_by_usuario(
                usuario_id=usuario_id,
                skip=skip,
                limit=limit,
                estado=estado,
            )
            return PedidosPaginados(
                total=total,
                items=[self._to_read(p) for p in items],
            )

    def get_by_id(self, pedido_id: int, user_id: int, role: str) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_by_id(pedido_id)
            if not pedido:
                raise PedidoNoEncontrado()
            if role != "admin" and pedido.usuario_id != user_id:
                raise PedidoAjeno()
            return self._to_read(pedido)

    def cambiar_estado(self, pedido_id: int, nuevo_estado: str) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_by_id(pedido_id)
            if not pedido:
                raise PedidoNoEncontrado()

            permitidas = TRANSICIONES_VALIDAS.get(pedido.estado, [])
            if nuevo_estado not in permitidas:
                raise TransicionInvalida(
                    f"Transición no permitida de {pedido.estado} a {nuevo_estado}"
                )

            # Si pasa a CANCELADO, restituir stock (RN-03)
            if nuevo_estado == "CANCELADO":
                for item in pedido.items:
                    producto = uow.productos.get_by_id(item.producto_id)
                    if producto:
                        producto.stock += item.cantidad
                        uow.productos.add(producto)

            pedido.estado = nuevo_estado
            pedido.updated_at = datetime.now(timezone.utc)
            uow.pedidos.add(pedido)
            return self._to_read(pedido)

    def cancelar_pedido_cliente(self, pedido_id: int, usuario_id: int) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_by_id(pedido_id)
            if not pedido:
                raise PedidoNoEncontrado()
            if pedido.usuario_id != usuario_id:
                raise PedidoAjeno()
            if pedido.estado != "PENDIENTE":
                raise TransicionInvalida("Solo se pueden cancelar pedidos en estado PENDIENTE")

            for item in pedido.items:
                producto = uow.productos.get_by_id(item.producto_id)
                if producto:
                    producto.stock += item.cantidad
                    uow.productos.add(producto)

            pedido.estado = "CANCELADO"
            pedido.updated_at = datetime.now(timezone.utc)
            uow.pedidos.add(pedido)
            return self._to_read(pedido)

    def get_resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            resumen_dict = uow.pedidos.get_resumen()
            return ResumenPedidos.model_validate(resumen_dict)
