import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface EstadoVacioProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EstadoVacio: React.FC<EstadoVacioProps> = ({
  title = 'No hay datos disponibles',
  description = 'No se encontraron registros que coincidan con la búsqueda o filtro actual.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#FDFBF7] rounded-[28px] border border-[#EAE1D3] shadow-amber-soft my-6">
      <div className="w-16 h-16 bg-[#FAF3EA] text-[#B84A1C] border border-[#EAE1D3] rounded-3xl flex items-center justify-center mb-4 shadow-xs">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-[#1F1E1D] mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-[#6E6862] max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
