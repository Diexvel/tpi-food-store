import React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { UserCheck, UserX, Shield, User } from 'lucide-react';
import { useUsuarios, useActivarUsuario, useDesactivarUsuario } from '../hooks/useUsuarios';
import { Usuario } from '../types';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EstadoError } from '../../../shared/components/EstadoError';
import { handleApiError } from '../../../shared/api/handleApiError';
import { useAuthStore } from '../../../store/authStore';

const colHelper = createColumnHelper<Usuario>();

export const AdminUsuariosPage: React.FC = () => {
  const { data: usuarios = [], isLoading, isError, refetch } = useUsuarios();
  const activarMut = useActivarUsuario();
  const desactivarMut = useDesactivarUsuario();
  const usuarioActual = useAuthStore((s) => s.usuario);

  const handleActivar = async (u: Usuario) => {
    try {
      await activarMut.mutateAsync(u.id);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleDesactivar = async (u: Usuario) => {
    try {
      await desactivarMut.mutateAsync(u.id);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const columnas = [
    colHelper.accessor('id', {
      header: 'ID',
      cell: (info) => <span className="text-xs text-stone-400 font-mono">#{info.getValue()}</span>,
    }),
    colHelper.accessor('username', {
      header: 'Usuario',
      cell: (info) => (
        <span className="font-mono font-semibold text-stone-900 text-sm">
          @{info.getValue()}
        </span>
      ),
    }),
    colHelper.accessor('full_name', {
      header: 'Nombre completo',
      cell: (info) => <span className="text-sm text-stone-700">{info.getValue()}</span>,
    }),
    colHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <span className="text-xs text-stone-500 truncate max-w-[180px] block">{info.getValue()}</span>
      ),
    }),
    colHelper.accessor('role', {
      header: 'Rol',
      cell: (info) =>
        info.getValue() === 'admin' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Shield className="w-3 h-3" /> Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <User className="w-3 h-3" /> Usuario
          </span>
        ),
    }),
    colHelper.accessor('disabled', {
      header: 'Estado',
      cell: (info) =>
        !info.getValue() ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Desactivado
          </span>
        ),
    }),
    colHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const u = row.original;
        const esMismo = usuarioActual?.id === u.id;
        const isLoading = activarMut.isPending || desactivarMut.isPending;

        return (
          <div className="flex items-center gap-2">
            {u.disabled ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleActivar(u)}
                loading={isLoading}
                disabled={esMismo}
                title={esMismo ? 'No puedes modificar tu propia cuenta' : 'Activar usuario'}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Activar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDesactivar(u)}
                loading={isLoading}
                disabled={esMismo}
                title={esMismo ? 'No puedes desactivar tu propia cuenta' : 'Desactivar usuario'}
              >
                <UserX className="w-3.5 h-3.5" />
                Desactivar
              </Button>
            )}
            {esMismo && (
              <span className="text-[10px] text-stone-400 italic">(tú)</span>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: usuarios,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <EstadoError title="Error al cargar usuarios" onRetry={() => { void refetch(); }} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Usuarios</h1>
        <p className="text-sm text-stone-500">{usuarios.length} usuarios registrados</p>
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
              {table.getRowModel().rows.map((row) => {
                const esMismo = usuarioActual?.id === row.original.id;
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${esMismo ? 'bg-amber-50/40' : 'hover:bg-stone-50/50'}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
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
    </div>
  );
};
