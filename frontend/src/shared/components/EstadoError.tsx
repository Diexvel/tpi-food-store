import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface EstadoErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const EstadoError: React.FC<EstadoErrorProps> = ({
  title = 'Ocurrió un error',
  message = 'No se pudieron cargar los datos. Por favor, intenta nuevamente.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-[#FDFBF7] rounded-[28px] border border-rose-200/80 shadow-amber-soft my-6">
      <div className="w-14 h-14 bg-rose-50 text-[#BF3E34] rounded-2xl flex items-center justify-center mb-3 border border-rose-100">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#1F1E1D] mb-1">{title}</h3>
      <p className="text-sm text-[#6E6862] max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw className="w-4 h-4 mr-1.5 text-[#B84A1C]" />
          Reintentar
        </Button>
      )}
    </div>
  );
};
