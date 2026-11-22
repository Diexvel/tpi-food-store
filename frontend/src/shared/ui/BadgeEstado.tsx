import React from 'react';

export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO';

interface BadgeEstadoProps {
  estado: EstadoPedido | string;
  className?: string;
}

export const BadgeEstado: React.FC<BadgeEstadoProps> = ({ estado, className = '' }) => {
  const configs: Record<string, { label: string; dot: string; classes: string }> = {
    PENDIENTE: {
      label: 'Pendiente',
      dot: 'bg-[#B84A1C]',
      classes: 'bg-[#FBECE1] text-[#B84A1C] border-[#F2D7C3]',
    },
    EN_PREPARACION: {
      label: 'En Preparación',
      dot: 'bg-[#C07722]',
      classes: 'bg-[#FEF5E7] text-[#C07722] border-[#F7E2BD]',
    },
    ENTREGADO: {
      label: 'Entregado',
      dot: 'bg-[#2D6A4F]',
      classes: 'bg-[#EAF3EB] text-[#2D6A4F] border-[#CDE5D1]',
    },
    CANCELADO: {
      label: 'Cancelado',
      dot: 'bg-[#A63A3A]',
      classes: 'bg-[#FBEBEB] text-[#A63A3A] border-[#EFC7C7]',
    },
  };

  const config = configs[estado] || {
    label: estado,
    dot: 'bg-[#8C827A]',
    classes: 'bg-[#F3ECE2] text-[#6E6862] border-[#E2D6C5]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.classes} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};
