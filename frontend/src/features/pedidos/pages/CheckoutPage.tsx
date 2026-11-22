import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { Banknote, CreditCard, MapPin, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { useCrearPedido } from '../hooks/usePedidos';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card } from '../../../shared/ui/Card';
import { handleApiError } from '../../../shared/api/handleApiError';
import { FormaPago } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, vaciar } = useCartStore();
  const crearPedidoMutation = useCrearPedido();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const form = useForm({
    defaultValues: {
      direccion_entrega: '',
      forma_pago: 'EFECTIVO' as FormaPago,
      notas: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null);

      if (items.length === 0) {
        setErrorMsg('El carrito está vacío. Agrega productos antes de confirmar.');
        return;
      }

      try {
        const payload = {
          items: items.map((i) => ({
            producto_id: i.producto_id,
            cantidad: i.cantidad,
          })),
          direccion_entrega: value.direccion_entrega.trim(),
          forma_pago: value.forma_pago,
          notas: value.notas.trim() ? value.notas.trim() : null,
        };

        await crearPedidoMutation.mutateAsync(payload);
        // Vaciar el carrito en estado persistido
        vaciar();
        // Redirigir a "Mis pedidos"
        navigate('/mis-pedidos');
      } catch (err) {
        setErrorMsg(handleApiError(err, 'No se pudo crear el pedido. Revisa el stock disponible.'));
      }
    },
  });

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold text-stone-900 mb-2">No hay productos en el carrito</h2>
          <p className="text-sm text-stone-500 mb-6">Agrega comidas deliciosas antes de realizar el checkout.</p>
          <Link to="/">
            <Button variant="primary">Ir al catálogo</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const totalCalculado = total();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Confirmar Pedido</h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">Completa los datos de envío y pago para preparar tu comida</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <h4 className="font-semibold text-rose-900">No se pudo procesar el pedido</h4>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6"
            >
              {/* Sección Dirección */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-base border-b border-stone-100 pb-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <h3>Dirección de entrega</h3>
                </div>

                <form.Field
                  name="direccion_entrega"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || value.trim().length < 5) {
                        return 'La dirección debe tener al menos 5 caracteres';
                      }
                      if (value.length > 200) {
                        return 'La dirección no puede superar los 200 caracteres';
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Input
                      label="Calle, número, piso y depto"
                      placeholder="ej. Av. San Martín 1234, Piso 4 Depto B"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      error={field.state.meta.errors?.[0] ? String(field.state.meta.errors[0]) : undefined}
                      helperText="Indica la dirección exacta para el repartidor"
                    />
                  )}
                </form.Field>
              </div>

              {/* Sección Forma de Pago */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-base border-b border-stone-100 pb-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <h3>Forma de pago</h3>
                </div>

                <form.Field name="forma_pago">
                  {(field) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                          field.state.value === 'EFECTIVO'
                            ? 'border-[#B84A1C] bg-[#FBECE1] ring-1 ring-[#B84A1C]/30'
                            : 'border-[#DECFC0] hover:border-[#DECDBA] bg-[#FDFBF7]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="forma_pago"
                          value="EFECTIVO"
                          checked={field.state.value === 'EFECTIVO'}
                          onChange={() => field.handleChange('EFECTIVO')}
                          className="text-[#B84A1C] focus:ring-[#B84A1C]"
                        />
                        <div className="flex items-center gap-2.5">
                          <Banknote className="w-5 h-5 text-emerald-700" />
                          <div>
                            <span className="text-sm font-bold text-[#1F1E1D] block">Efectivo</span>
                            <span className="text-xs text-[#6E6862]">Pagas al recibir tu pedido</span>
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                          field.state.value === 'TRANSFERENCIA'
                            ? 'border-[#B84A1C] bg-[#FBECE1] ring-1 ring-[#B84A1C]/30'
                            : 'border-[#DECFC0] hover:border-[#DECDBA] bg-[#FDFBF7]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="forma_pago"
                          value="TRANSFERENCIA"
                          checked={field.state.value === 'TRANSFERENCIA'}
                          onChange={() => field.handleChange('TRANSFERENCIA')}
                          className="text-[#B84A1C] focus:ring-[#B84A1C]"
                        />
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-5 h-5 text-[#B84A1C]" />
                          <div>
                            <span className="text-sm font-bold text-[#1F1E1D] block">Transferencia</span>
                            <span className="text-xs text-[#6E6862]">Alias o CBU bancario</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Sección Notas Adicionales */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-base border-b border-stone-100 pb-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h3>Notas adicionales (opcional)</h3>
                </div>

                <form.Field name="notas">
                  {(field) => (
                    <textarea
                      rows={3}
                      placeholder="ej. Tocar timbre 'García', salsa aparte, etc."
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="w-full px-4 py-3 rounded-2xl border border-[#DECFC0] bg-[#FDFBF7] text-[#1F1E1D] placeholder-[#A49C94] text-sm shadow-ivory-inset focus:outline-none focus:ring-2 focus:ring-[#B84A1C]/20 focus:border-[#B84A1C]"
                    />
                  )}
                </form.Field>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3.5 text-base font-bold shadow-md mt-6"
                loading={crearPedidoMutation.isPending}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar y Realizar Pedido
              </Button>
            </form>
          </Card>
        </div>

        {/* Resumen Lateral */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
              Detalle de los ítems ({items.length})
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.producto_id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 pr-2">
                    <span className="font-semibold text-stone-800">{i.nombre}</span>
                    <span className="text-stone-400 block">x{i.cantidad} ({formatPrice(i.precio_unitario)})</span>
                  </div>
                  <span className="font-bold text-stone-900">
                    {formatPrice(i.precio_unitario * i.cantidad)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 space-y-2">
              <div className="flex justify-between text-xs text-stone-500">
                <span>Envío</span>
                <span className="text-emerald-600 font-semibold">Gratis</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-base font-bold text-stone-900">Total</span>
                <span className="text-2xl font-black text-amber-700">{formatPrice(totalCalculado)}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl text-[11px] text-amber-800 border border-amber-200/50">
              ⚡ Al confirmar tu pedido, el stock se reservará al instante y comenzará su preparación.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
