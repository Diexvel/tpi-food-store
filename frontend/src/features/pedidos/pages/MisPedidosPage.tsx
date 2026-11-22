import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePedidos, useCancelarPedido } from '../hooks/usePedidos';
import { BadgeEstado } from '../../../shared/ui/BadgeEstado';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Modal } from '../../../shared/ui/Modal';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';
import { EstadoError } from '../../../shared/components/EstadoError';
import { handleApiError } from '../../../shared/api/handleApiError';
import { Pedido } from '../types';

export const MisPedidosPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = usePedidos({ limit: 100 });
  const cancelarMutation = useCancelarPedido();
  
  const [pedidoParaCancelar, setPedidoParaCancelar] = useState<Pedido | null>(null);
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);

  const handleConfirmarCancelacion = async () => {
    if (!pedidoParaCancelar) return;
    setErrorCancelacion(null);
    try {
      await cancelarMutation.mutateAsync(pedidoParaCancelar.id);
      setPedidoParaCancelar(null);
    } catch (err) {
      setErrorCancelacion(handleApiError(err));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <EstadoError
          title="Error al cargar pedidos"
          message={handleApiError(error)}
          onRetry={() => { void refetch(); }}
        />
      </div>
    );
  }

  const pedidos = data?.items ?? [];

  if (pedidos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EstadoVacio
          title="Aún no realizaste ningún pedido"
          description="Explora nuestro catálogo y hace tu primer pedido ahora."
          actionText="Ir al Catálogo"
          onAction={() => window.location.href = '/'}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="text-sm text-gray-500">Historial y estado de tus compras</p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm">Seguir comprando</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {pedidos.map((pedido) => {
          const fecha = new Date(pedido.created_at).toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });

          return (
            <Card key={pedido.id} className="p-6 rounded-[28px] border-[#EAE1D3] shadow-amber-soft bg-[#FDFBF7]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE1D3] gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-[#1F1E1D]">Pedido #{pedido.id}</span>
                    <BadgeEstado estado={pedido.estado} />
                  </div>
                  <span className="text-xs text-[#8C827A] mt-0.5 block">{fecha}</span>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span className="text-2xl font-black text-[#B84A1C]">
                    ${pedido.total.toFixed(2)}
                  </span>
                  {pedido.estado === 'PENDIENTE' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPedidoParaCancelar(pedido)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* Items del pedido */}
              <div className="mt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8C827A] mb-2">
                  Productos ({pedido.items.length})
                </h4>
                <div className="divide-y divide-[#EAE1D3] border border-[#EAE1D3] rounded-2xl overflow-hidden bg-[#FAF5ED]">
                  {pedido.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-[#1F1E1D]">{item.nombre_producto}</p>
                        <p className="text-xs text-[#6E6862]">
                          {item.cantidad} x ${item.precio_unitario.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-bold text-[#1F1E1D]">
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalles de entrega y pago */}
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">Dirección: </span>
                  {pedido.direccion_entrega}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Forma de pago: </span>
                  <span className="font-semibold text-gray-800">{pedido.forma_pago}</span>
                </div>
                {pedido.notas && (
                  <div className="sm:col-span-2 text-gray-500 italic">
                    <span className="font-medium text-gray-700 not-italic">Notas: </span>
                    {pedido.notas}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de confirmación de cancelación */}
      <Modal
        isOpen={pedidoParaCancelar !== null}
        onClose={() => {
          setPedidoParaCancelar(null);
          setErrorCancelacion(null);
        }}
        title={`Cancelar Pedido #${pedidoParaCancelar?.id}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas cancelar este pedido? Los productos volverán al stock automáticamente. Esta acción no se puede revertir.
          </p>

          {errorCancelacion && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {errorCancelacion}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => {
                setPedidoParaCancelar(null);
                setErrorCancelacion(null);
              }}
              disabled={cancelarMutation.isPending}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmarCancelacion}
              loading={cancelarMutation.isPending}
            >
              Sí, cancelar pedido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
