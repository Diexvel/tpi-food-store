import React from 'react';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useResumenPedidos } from '../hooks/usePedidos';
import { Card } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EstadoError } from '../../../shared/components/EstadoError';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass, bgClass, borderClass }) => (
  <Card className={`p-6 rounded-[24px] border ${borderClass} ${bgClass} shadow-amber-soft`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8C827A] mb-1.5">{label}</p>
        <p className={`text-3xl font-black ${colorClass} tracking-tight`}>{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${colorClass} bg-[#FDFBF7] shadow-xs border border-[#EAE1D3]`}>
        {icon}
      </div>
    </div>
  </Card>
);

export const AdminResumenPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useResumenPedidos();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Resumen de Ventas</h1>
          <p className="text-sm text-stone-500">Panel de control — vista general</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EstadoError
        title="No se pudo cargar el resumen"
        message="Verifica tu conexión e intenta nuevamente."
        onRetry={() => { void refetch(); }}
      />
    );
  }

  const r = data!;

  const stats: StatCardProps[] = [
    {
      label: 'Pendientes',
      value: r.pendientes,
      icon: <Clock className="w-5 h-5 text-[#B84A1C]" />,
      colorClass: 'text-[#B84A1C]',
      bgClass: 'bg-[#FBECE1]/60',
      borderClass: 'border-[#F2D7C3]',
    },
    {
      label: 'En Preparación',
      value: r.en_preparacion,
      icon: <ChefHat className="w-5 h-5 text-[#C07722]" />,
      colorClass: 'text-[#C07722]',
      bgClass: 'bg-[#FEF5E7]/60',
      borderClass: 'border-[#F7E2BD]',
    },
    {
      label: 'Entregados',
      value: r.entregados,
      icon: <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />,
      colorClass: 'text-[#2D6A4F]',
      bgClass: 'bg-[#EAF3EB]/60',
      borderClass: 'border-[#CDE5D1]',
    },
    {
      label: 'Cancelados',
      value: r.cancelados,
      icon: <XCircle className="w-5 h-5 text-[#A63A3A]" />,
      colorClass: 'text-[#A63A3A]',
      bgClass: 'bg-[#FBEBEB]/60',
      borderClass: 'border-[#EFC7C7]',
    },
    {
      label: 'Pedidos Hoy',
      value: r.pedidos_hoy,
      icon: <Calendar className="w-5 h-5 text-[#7B4B94]" />,
      colorClass: 'text-[#7B4B94]',
      bgClass: 'bg-[#F5EEF8]/60',
      borderClass: 'border-[#E7D6EE]',
    },
    {
      label: 'Ingresos Entregados',
      value: `$${r.ingresos_entregados.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
      icon: <DollarSign className="w-5 h-5 text-[#1E6B65]" />,
      colorClass: 'text-[#1E6B65]',
      bgClass: 'bg-[#EBF5F4]/60',
      borderClass: 'border-[#CDE8E5]',
    },
  ];

  const totalPedidos = r.pendientes + r.en_preparacion + r.entregados + r.cancelados;
  const tasaEntrega = totalPedidos > 0
    ? Math.round((r.entregados / totalPedidos) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            Resumen de Ventas
          </h1>
          <p className="text-sm text-stone-500 mt-1">Panel de control — vista general del negocio</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Barra de progreso de tasa de entrega */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-stone-700 mb-4">Distribución de pedidos totales ({totalPedidos})</h3>
        <div className="space-y-3">
          {[
            { label: 'Entregados', count: r.entregados, colorClass: 'bg-emerald-500' },
            { label: 'Cancelados', count: r.cancelados, colorClass: 'bg-rose-400' },
            { label: 'En Preparación', count: r.en_preparacion, colorClass: 'bg-blue-400' },
            { label: 'Pendientes', count: r.pendientes, colorClass: 'bg-amber-400' },
          ].map(({ label, count, colorClass }) => {
            const pct = totalPedidos > 0 ? (count / totalPedidos) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-xs text-stone-600 mb-1">
                  <span>{label}</span>
                  <span className="font-semibold">{count} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorClass} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-5 border-t border-stone-100 flex items-center justify-between text-sm">
          <span className="text-stone-500">Tasa de entrega exitosa</span>
          <span className="text-2xl font-black text-emerald-700">{tasaEntrega}%</span>
        </div>
      </Card>
    </div>
  );
};
