import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProductos } from '../hooks/useProductos';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { ProductoCard } from '../components/ProductoCard';
import { CardSkeleton } from '../../../shared/components/Skeleton';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';
import { EstadoError } from '../../../shared/components/EstadoError';
import { Paginacion } from '../../../shared/components/Paginacion';

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
    <div className="space-y-10 animate-fade-in">
      {/* Banner Hero estilo AMBER / INTERFACE */}
      <div className="relative rounded-[32px] bg-[#FAF5ED] border border-[#EAE1D3] p-8 sm:p-12 shadow-amber-soft overflow-hidden">
        {/* Decoración abstracta suave */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F3ECE2] rounded-full filter blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-20 w-64 h-64 bg-[#FDEEE2] rounded-full filter blur-2xl opacity-50 -mb-20 pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#B84A1C] bg-[#FBECE1] border border-[#F2D7C3] px-3 py-1 rounded-full">
              Catalogo de productos
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#1F1E1D] tracking-tight leading-tight">
            FOOD Store
          </h1>
          <p className="text-base sm:text-lg text-[#6E6862] mt-3 font-normal leading-relaxed">
            Hamburguesas artesanales, pizzas napolitanas al horno de barro y postres gourmet preparados con dedicación.
          </p>


        </div>
      </div>

      {/* Barra de Filtros y Búsqueda estilo */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Input de Búsqueda pastilla pillowy */}
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C827A]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre (ej. burger, margherita)..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-11 pr-11 py-3.5 rounded-full border border-[#DECFC0] bg-[#FDFBF7] text-[#1F1E1D] placeholder-[#A49C94] text-sm shadow-ivory-inset transition-all focus:outline-none focus:ring-2 focus:ring-[#B84A1C]/20 focus:border-[#B84A1C]"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8C827A] hover:text-[#1F1E1D] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#A49C94]">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8C827A] self-end sm:self-center">
            {isLoading ? 'Buscando...' : `${total} ${total === 1 ? 'producto' : 'productos'}`}
          </div>
        </div>

        {/* Categorías estilo Pastillas / Moodboard Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoriaClick(undefined)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 shrink-0 cursor-pointer ${categoriaId === undefined
              ? 'bg-[#B84A1C] text-white shadow-amber-pill'
              : 'bg-[#FDFBF7] text-[#6E6862] border border-[#DECFC0] hover:bg-[#F3ECE2] hover:text-[#1F1E1D]'
              }`}
          >
            Todas las comidas
          </button>
          {categorias.map((cat) => {
            const isSelected = categoriaId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoriaClick(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 shrink-0 cursor-pointer ${isSelected
                  ? 'bg-[#B84A1C] text-white shadow-amber-pill'
                  : 'bg-[#FDFBF7] text-[#6E6862] border border-[#DECFC0] hover:bg-[#F3ECE2] hover:text-[#1F1E1D]'
                  }`}
              >
                {cat.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Productos */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EstadoError
          title="Error al cargar productos"
          message={error instanceof Error ? error.message : 'No se pudo cargar el catálogo.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : items.length === 0 ? (
        <EstadoVacio
          title="No encontramos productos"
          description="Intenta cambiando el término de búsqueda o seleccionando otra categoría."
          actionText="Limpiar filtros"
          onAction={limpiarFiltros}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((prod) => (
              <ProductoCard key={prod.id} producto={prod} />
            ))}
          </div>

          {/* Paginación en Servidor */}
          {total > PAGE_SIZE && (
            <div className="pt-6 border-t border-[#EAE1D3] flex justify-center">
              <Paginacion
                skip={skip}
                limit={PAGE_SIZE}
                total={total}
                onPageChange={(newSkip) => {
                  setSkip(newSkip);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
