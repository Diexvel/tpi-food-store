import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface PaginacionProps {
  total: number;
  skip: number;
  limit: number;
  onPageChange: (newSkip: number) => void;
  className?: string;
}

export const Paginacion: React.FC<PaginacionProps> = ({
  total,
  skip,
  limit,
  onPageChange,
  className = '',
}) => {
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (skip - limit >= 0) {
      onPageChange(skip - limit);
    }
  };

  const handleNext = () => {
    if (skip + limit < total) {
      onPageChange(skip + limit);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-4 py-3 px-2 ${className}`}>
      <span className="text-xs text-stone-500">
        Mostrando <span className="font-semibold text-stone-800">{Math.min(skip + 1, total)}</span> a{' '}
        <span className="font-semibold text-stone-800">{Math.min(skip + limit, total)}</span> de{' '}
        <span className="font-semibold text-stone-800">{total}</span> resultados
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <span className="text-xs font-medium text-stone-700 px-2">
          Página {currentPage} de {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
