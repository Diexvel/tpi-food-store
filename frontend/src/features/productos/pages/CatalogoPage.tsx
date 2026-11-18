import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProductos } from '../hooks/useProductos';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { ProductoCard } from '../components/ProductoCard';
import { CardSkeleton } from '../../../shared/components/Skeleton';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';
import { EstadoError } from '../../../shared/components/EstadoError';
import { Paginacion } from '../../../shared/components/Paginacion';
import { Input } from '../../../shared/ui/Input';

const PAGE_SIZE = 8;

export const CatalogoPage: React.FC = () => {
  const [skip, setSkip] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);

  // Consulta de categorías para filtros
  const { data: categorias = [] } = useCategorias();

  // Consulta de productos paginados en servidor
  const {
    data: productosData,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductos({
    skip,
    limit: PAGE_SIZE,
    search: searchTerm.trim() ? searchTerm.trim() : undefined,
    categoria_id: categoriaId,
    disponible: true,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSkip(0); // Reiniciar a la primera página ante nueva búsqueda
  };

  const handleCategoriaClick = (catId?: number) => {
    setCategoriaId(catId);
    setSkip(0);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setCategoriaId(undefined);
    setSkip(0);
  };

  const total = productosData?.total ?? 0;
  const items = productosData?.items ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Bienvenida */}
      <div className="relative rounded-3xl bg-linear-to-r from-amber-600 to-amber-700 p-8 sm:p-12 text-white shadow-sm overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-amber-500/30 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
            ¡Pedí fácil, rápido y caliente! 🛵
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Nuestras especialidades gastronómicas
          </h1>
          <p className="text-amber-100 text-sm sm:text-base">
            Descubrí nuestras deliciosas hamburguesas artesanales, pizzas napolitanas al horno, bebidas y postres caseros listos para disfrutar.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 text-9xl opacity-15 select-none pointer-events-none translate-x-6 translate-y-6">
          🍔
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          {/* Input de Búsqueda */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre (ej. Doble Bacon, Margherita...)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSkip(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Información de resultados */}
          <div className="text-xs text-stone-500 font-medium self-end sm:self-center">
            Total en catálogo: <span className="font-bold text-stone-800">{total}</span>
          </div>
        </div>

        {/* Píldoras de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs text-stone-400 font-medium mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Categoría:
          </span>

          <button
            onClick={() => handleCategoriaClick(undefined)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              categoriaId === undefined
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            Todas
          </button>

          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoriaClick(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                categoriaId === cat.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Estados de Carga, Error o Cuadrícula de Productos */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EstadoError
          title="No pudimos cargar el catálogo"
          message={error instanceof Error ? error.message : 'Error al conectar con el servidor'}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EstadoVacio
          title="No se encontraron productos"
          description="Intenta buscar con otro término o seleccionando una categoría diferente."
          actionText="Limpiar filtros"
          onAction={limpiarFiltros}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((prod) => (
              <ProductoCard key={prod.id} producto={prod} />
            ))}
          </div>

          {/* Paginación en Servidor */}
          <Paginacion
            total={total}
            skip={skip}
            limit={PAGE_SIZE}
            onPageChange={(newSkip) => setSkip(newSkip)}
          />
        </div>
      )}
    </div>
  );
};
