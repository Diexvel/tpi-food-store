import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useForm } from '@tanstack/react-form';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import {
  useProductos,
  useCrearProducto,
  useActualizarProducto,
  useActualizarStockProducto,
  useEliminarProducto,
} from '../hooks/useProductos';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { Producto, ProductoCreate } from '../types';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Modal } from '../../../shared/ui/Modal';
import { Card } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EstadoError } from '../../../shared/components/EstadoError';
import { handleApiError } from '../../../shared/api/handleApiError';

const colHelper = createColumnHelper<Producto>();

type FormValues = {
  nombre: string;
  descripcion: string;
  precio_base: string;
  imagen_url: string;
  stock: string;
  disponible: boolean;
  categoria_id: string;
};

export const AdminProductosPage: React.FC = () => {
  const { data: productosData, isLoading, isError, refetch } = useProductos({ limit: 100 });
  const { data: categorias = [] } = useCategorias();
  const crearMut = useCrearProducto();
  const actualizarMut = useActualizarProducto();
  const actualizarStockMut = useActualizarStockProducto();
  const eliminarMut = useEliminarProducto();

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);

  const productos = productosData?.items ?? [];

  const defaultFormValues: FormValues = {
    nombre: '',
    descripcion: '',
    precio_base: '',
    imagen_url: '',
    stock: '0',
    disponible: true,
    categoria_id: '',
  };

  const form = useForm({
    defaultValues: defaultFormValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      const precio = parseFloat(value.precio_base);
      const stock = parseInt(value.stock, 10);
      const catId = parseInt(value.categoria_id, 10);

      if (isNaN(precio) || precio <= 0) {
        setFormError('El precio debe ser un número mayor a 0');
        return;
      }
      if (isNaN(stock) || stock < 0) {
        setFormError('El stock debe ser 0 o mayor');
        return;
      }
      if (isNaN(catId)) {
        setFormError('Selecciona una categoría');
        return;
      }

      const payload: ProductoCreate = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: precio,
        imagen_url: value.imagen_url.trim() || null,
        stock,
        disponible: value.disponible,
        categoria_id: catId,
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
    form.reset(defaultFormValues);
    setFormError(null);
    setModalOpen(true);
  };

  const abrirEditar = (p: Producto) => {
    setEditando(p);
    form.reset({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio_base: String(p.precio_base),
      imagen_url: p.imagen_url ?? '',
      stock: String(p.stock),
      disponible: p.disponible,
      categoria_id: String(p.categoria_id),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
    form.reset(defaultFormValues);
    setFormError(null);
  };

  const handleToggleDisponible = async (p: Producto) => {
    try {
      await actualizarStockMut.mutateAsync({
        id: p.id,
        data: { stock: p.stock, disponible: !p.disponible },
      });
    } catch (err) {
      alert(handleApiError(err));
    }
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
    }),
    colHelper.accessor('nombre', {
      header: 'Producto',
      cell: (info) => {
        const p = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 overflow-hidden">
              {p.imagen_url ? (
                <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">{info.getValue()}</p>
              <p className="text-xs text-stone-400 line-clamp-1">{p.descripcion}</p>
            </div>
          </div>
        );
      },
    }),
    colHelper.accessor('categoria', {
      header: 'Categoría',
      cell: (info) => (
        <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
          {info.getValue()?.nombre ?? '—'}
        </span>
      ),
    }),
    colHelper.accessor('precio_base', {
      header: 'Precio',
      cell: (info) => (
        <span className="font-bold text-stone-800">
          ${info.getValue().toLocaleString('es-AR', { maximumFractionDigits: 0 })}
        </span>
      ),
    }),
    colHelper.accessor('stock', {
      header: 'Stock',
      cell: (info) => {
        const v = info.getValue();
        return (
          <span
            className={`text-sm font-semibold ${
              v === 0 ? 'text-rose-600' : v <= 5 ? 'text-amber-600' : 'text-emerald-700'
            }`}
          >
            {v}
          </span>
        );
      },
    }),
    colHelper.accessor('disponible', {
      header: 'Disponible',
      cell: ({ row }) => (
        <button
          onClick={() => handleToggleDisponible(row.original)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
            row.original.disponible ? 'bg-emerald-500' : 'bg-stone-300'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
              row.original.disponible ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
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
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(row.original)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: productos,
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
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <EstadoError title="Error al cargar productos" onRetry={() => { void refetch(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
          <p className="text-sm text-stone-500">{productos.length} productos registrados</p>
        </div>
        <Button onClick={abrirCrear} variant="primary">
          <Plus className="w-4 h-4" />
          Nuevo Producto
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

      {/* Modal Crear/Editar */}
      <Modal isOpen={modalOpen} onClose={cerrarModal} title={editando ? `Editar: ${editando.nombre}` : 'Nuevo Producto'} maxWidth="lg">
        <form
          onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <form.Field
                name="nombre"
                validators={{ onChange: ({ value }) => !value.trim() ? 'El nombre es obligatorio' : undefined }}
              >
                {(field) => (
                  <Input
                    label="Nombre *"
                    placeholder="ej. Pizza Margherita"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={field.state.meta.errors?.[0] ? String(field.state.meta.errors[0]) : undefined}
                  />
                )}
              </form.Field>
            </div>

            <form.Field name="precio_base">
              {(field) => (
                <Input
                  label="Precio base *"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1500"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>

            <form.Field name="stock">
              {(field) => (
                <Input
                  label="Stock *"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>

            <div className="col-span-2">
              <form.Field name="categoria_id">
                {(field) => (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Categoría *</label>
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="">— Seleccionar categoría —</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="col-span-2">
              <form.Field name="imagen_url">
                {(field) => (
                  <Input
                    label="URL de imagen (opcional)"
                    type="url"
                    placeholder="https://..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </form.Field>
            </div>

            <div className="col-span-2">
              <form.Field name="descripcion">
                {(field) => (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Descripción (opcional)</label>
                    <textarea
                      rows={2}
                      placeholder="Descripción del producto..."
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="col-span-2">
              <form.Field name="disponible">
                {(field) => (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-stone-700">Disponible para la venta</span>
                  </label>
                )}
              </form.Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={cerrarModal} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {editando ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Eliminar Producto">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            ¿Eliminar <strong className="text-stone-900">"{confirmDelete?.nombre}"</strong>? Se hará un borrado lógico.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={eliminarMut.isPending}>Cancelar</Button>
            <Button variant="danger" onClick={handleEliminar} loading={eliminarMut.isPending}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
