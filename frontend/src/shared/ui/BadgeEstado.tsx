import React from 'react';

export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO';

interface BadgeEstadoProps {
  estado: EstadoPedido | string;
  className?: string;
}

export const BadgeEstado: React.FC<BadgeEstadoProps> = ({ estado, className = '' }) => {
  const configs: Record<string, { label: string; classes: string }> = {
    PENDIENTE: {
      label: 'Pendiente',
      classes: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/10',
    },
    EN_PREPARACION: {
      label: 'En Preparación',
      classes: 'bg-blue-50 text-blue-800 border-blue-200 ring-blue-500/10',
    },
    ENTREGADO: {
      label: 'Entregado',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/10',
    },
    CANCELADO: {
      label: 'Cancelado',
      classes: 'bg-rose-50 text-rose-800 border-rose-200 ring-rose-500/10',
    },
  };

  const config = configs[estado] || {
    label: estado,
    classes: 'bg-stone-100 text-stone-700 border-stone-200 ring-stone-500/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ring-1 ring-inset ${config.classes} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {config.label}
    </span>
  );
};
