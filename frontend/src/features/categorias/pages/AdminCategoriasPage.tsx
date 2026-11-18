import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useForm } from '@tanstack/react-form';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import {
  useCategorias,
  useCrearCategoria,
  useActualizarCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias';
import { Categoria, CategoriaCreate } from '../types';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Modal } from '../../../shared/ui/Modal';
import { Card } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EstadoError } from '../../../shared/components/EstadoError';
import { handleApiError } from '../../../shared/api/handleApiError';

const colHelper = createColumnHelper<Categoria>();

export const AdminCategoriasPage: React.FC = () => {
  const { data: categorias = [], isLoading, isError, refetch } = useCategorias();
  const crearMut = useCrearCategoria();
  const actualizarMut = useActualizarCategoria();
  const eliminarMut = useEliminarCategoria();

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null);

  const form = useForm({
    defaultValues: { nombre: '', descripcion: '' },
    onSubmit: async ({ value }) => {
      setFormError(null);
      const payload: CategoriaCreate = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
      };
      try {
        if (editando) {
          await actualizarMut.mutateAsync({ id: editando.id, data: payload });
        } else {
          await crearMut.mutateAsync(payload);
        }
        cerrarModal();
      } catch (err) {
        setFormError(handleApiError(err));
      }
    },
  });

  const abrirCrear = () => {
    setEditando(null);
    form.reset();
    setFormError(null);
    setModalOpen(true);
  };

  const abrirEditar = (cat: Categoria) => {
    setEditando(cat);
    form.reset({
      nombre: cat.nombre,
      descripcion: cat.descripcion ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
    form.reset();
    setFormError(null);
  };

  const handleEliminar = async () => {
    if (!confirmDelete) return;
    try {
      await eliminarMut.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      setConfirmDelete(null);
      alert(handleApiError(err));
    }
  };

  const columnas = [
    colHelper.accessor('id', {
      header: 'ID',
      cell: (info) => <span className="text-xs text-stone-400 font-mono">#{info.getValue()}</span>,
      size: 60,
    }),
    colHelper.accessor('nombre', {
      header: 'Nombre',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-semibold text-stone-900">{info.getValue()}</span>
        </div>
      ),
    }),
    colHelper.accessor('descripcion', {
      header: 'Descripción',
      cell: (info) => (
        <span className="text-sm text-stone-500 line-clamp-1">
          {info.getValue() ?? <span className="italic text-stone-300">Sin descripción</span>}
        </span>
      ),
    }),
    colHelper.accessor('activo', {
      header: 'Estado',
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Activa
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 border border-stone-200">
            Inactiva
          </span>
        ),
    }),
    colHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => abrirEditar(row.original)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setConfirmDelete(row.original)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: categorias,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const isPending = crearMut.isPending || actualizarMut.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <EstadoError
        title="Error al cargar categorías"
        onRetry={() => { void refetch(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Categorías</h1>
          <p className="text-sm text-stone-500">{categorias.length} categorías registradas</p>
        </div>
        <Button onClick={abrirCrear} variant="primary">
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
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
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50/50">
            <span className="text-xs text-stone-500">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={cerrarModal}
        title={editando ? `Editar: ${editando.nombre}` : 'Nueva Categoría'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
              {formError}
            </div>
          )}

          <form.Field
            name="nombre"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? 'El nombre es obligatorio' : undefined,
            }}
          >
            {(field) => (
              <Input
                label="Nombre *"
                placeholder="ej. Pizzas"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.errors?.[0] ? String(field.state.meta.errors[0]) : undefined}
              />
            )}
          </form.Field>

          <form.Field name="descripcion">
            {(field) => (
              <div className="w-full">
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Descripción (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Descripción breve de la categoría..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            )}
          </form.Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={cerrarModal} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {editando ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={`Eliminar Categoría`}
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            ¿Estás seguro de que deseas eliminar la categoría{' '}
            <strong className="text-stone-900">"{confirmDelete?.nombre}"</strong>?
            Esta acción realiza un borrado lógico.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={eliminarMut.isPending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleEliminar} loading={eliminarMut.isPending}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
