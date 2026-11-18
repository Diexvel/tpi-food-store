import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChefHat, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { usePedidos, useCambiarEstadoPedido } from '../hooks/usePedidos';
import { Pedido, EstadoPedido } from '../types';
import { BadgeEstado } from '../../../shared/ui/BadgeEstado';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Modal } from '../../../shared/ui/Modal';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EstadoError } from '../../../shared/components/EstadoError';
import { handleApiError } from '../../../shared/api/handleApiError';

const colHelper = createColumnHelper<Pedido>();

// Máquina de estados RN-02
const TRANSICIONES: Record<EstadoPedido, EstadoPedido | null> = {
  PENDIENTE: 'EN_PREPARACION',
  EN_PREPARACION: 'ENTREGADO',
  ENTREGADO: null,
  CANCELADO: null,
};

const LABEL_SIGUIENTE: Record<string, string> = {
  EN_PREPARACION: 'Iniciar Preparación',
  ENTREGADO: 'Marcar Entregado',
};

const ESTADOS_FILTRO: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'EN_PREPARACION', label: 'En Preparación' },
  { value: 'ENTREGADO', label: 'Entregados' },
  { value: 'CANCELADO', label: 'Cancelados' },
];

export const AdminPedidosPage: React.FC = () => {
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [confirmAccion, setConfirmAccion] = useState<{
    pedido: Pedido;
    nuevoEstado: EstadoPedido;
    tipo: 'avanzar' | 'cancelar';
  } | null>(null);

  const { data, isLoading, isError, refetch } = usePedidos({
    limit: 100,
    estado: estadoFiltro || undefined,
  });

  const cambiarEstadoMut = useCambiarEstadoPedido();

  const pedidos = data?.items ?? [];

  const handleAvanzar = (pedido: Pedido) => {
    const siguiente = TRANSICIONES[pedido.estado];
    if (!siguiente) return;
    setConfirmAccion({ pedido, nuevoEstado: siguiente, tipo: 'avanzar' });
  };

  const handleCancelar = (pedido: Pedido) => {
    setConfirmAccion({ pedido, nuevoEstado: 'CANCELADO', tipo: 'cancelar' });
  };

  const handleConfirmar = async () => {
    if (!confirmAccion) return;
    try {
      await cambiarEstadoMut.mutateAsync({
        id: confirmAccion.pedido.id,
        estado: confirmAccion.nuevoEstado,
      });
      setConfirmAccion(null);
    } catch (err) {
      alert(handleApiError(err));
      setConfirmAccion(null);
    }
  };

  const columnas = [
    colHelper.accessor('id', {
      header: 'Pedido',
      cell: (info) => <span className="font-mono font-bold text-stone-700">#{info.getValue()}</span>,
    }),
    colHelper.display({
      id: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => (
        <span className="text-sm text-stone-600">Usuario #{row.original.usuario_id}</span>
      ),
    }),
    colHelper.accessor('estado', {
      header: 'Estado',
      cell: (info) => <BadgeEstado estado={info.getValue()} />,
    }),
    colHelper.accessor('forma_pago', {
      header: 'Pago',
      cell: (info) => (
        <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
          {info.getValue()}
        </span>
      ),
    }),
    colHelper.accessor('total', {
      header: 'Total',
      cell: (info) => (
        <span className="font-bold text-stone-900">
          ${info.getValue().toLocaleString('es-AR', { maximumFractionDigits: 0 })}
        </span>
      ),
    }),
    colHelper.accessor('created_at', {
      header: 'Fecha',
      cell: (info) => (
        <span className="text-xs text-stone-500">
          {new Date(info.getValue()).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    }),
    colHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const p = row.original;
        const siguiente = TRANSICIONES[p.estado];
        const puedeAvanzar = siguiente !== null;
        const puedeCancelar = p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION';

        return (
          <div className="flex items-center gap-2">
            {puedeAvanzar && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAvanzar(p)}
                className="text-[11px]"
              >
                {siguiente === 'EN_PREPARACION' ? (
                  <ChefHat className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {LABEL_SIGUIENTE[siguiente]}
              </Button>
            )}
            {puedeCancelar && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleCancelar(p)}
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: pedidos,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <EstadoError title="Error al cargar pedidos" onRetry={() => { void refetch(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
          <p className="text-sm text-stone-500">{data?.total ?? 0} pedidos en total</p>
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <div className="flex flex-wrap gap-2">
            {ESTADOS_FILTRO.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setEstadoFiltro(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  estadoFiltro === value
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-stone-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length} className="text-center py-12 text-stone-400 text-sm">
                    No hay pedidos con el filtro seleccionado
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50/50">
            <span className="text-xs text-stone-500">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Anterior
              </Button>
              <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Confirmar acción */}
      <Modal
        isOpen={confirmAccion !== null}
        onClose={() => setConfirmAccion(null)}
        title={confirmAccion?.tipo === 'cancelar' ? 'Cancelar Pedido' : 'Avanzar Estado'}
      >
        {confirmAccion && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              {confirmAccion.tipo === 'cancelar' ? (
                <>
                  ¿Cancelar el <strong>Pedido #{confirmAccion.pedido.id}</strong>?
                  El stock de los productos será restituido automáticamente.
                </>
              ) : (
                <>
                  Cambiar el estado del <strong>Pedido #{confirmAccion.pedido.id}</strong> de{' '}
                  <BadgeEstado estado={confirmAccion.pedido.estado} /> a{' '}
                  <BadgeEstado estado={confirmAccion.nuevoEstado} />.
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmAccion(null)} disabled={cambiarEstadoMut.isPending}>
                Cancelar
              </Button>
              <Button
                variant={confirmAccion.tipo === 'cancelar' ? 'danger' : 'primary'}
                onClick={handleConfirmar}
                loading={cambiarEstadoMut.isPending}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
