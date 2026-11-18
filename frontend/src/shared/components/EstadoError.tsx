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
    <div className="flex flex-col items-center justify-center text-center p-8 bg-rose-50/50 rounded-2xl border border-rose-200 my-4">
      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 mb-1">{title}</h3>
      <p className="text-sm text-rose-700 max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
};
