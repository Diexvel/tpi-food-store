import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';

export const CarritoPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, quitar, cambiarCantidad, vaciar, total } = useCartStore();
  const usuario = useAuthStore((state) => state.usuario);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (items.length === 0) {
    return (
      <div className="py-8">
        <EstadoVacio
          title="Tu carrito está vacío"
          description="Aún no has agregado ninguna comida o bebida deliciosa. Recorre nuestro catálogo para comenzar."
          actionText="Ver Catálogo"
          onAction={() => navigate('/')}
          icon={<ShoppingBag className="w-8 h-8 text-[#B84A1C]" />}
        />
      </div>
    );
  }

  const handleCheckoutClick = () => {
    if (!usuario) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const totalCalculado = total();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#EAE1D3] pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B84A1C] block mb-1">
            AMBER / ORDER SUMMARY
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F1E1D] tracking-tight">Tu Carrito</h1>
          <p className="text-xs sm:text-sm text-[#6E6862] mt-0.5">Revisa tus productos antes de confirmar el pedido</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={vaciar}
          className="text-[#6E6862] hover:text-[#BF3E34] hover:border-rose-300"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Vaciar carrito
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const subtotal = item.precio_unitario * item.cantidad;
            const puedeAumentar =
              item.stock_maximo === undefined || item.cantidad < item.stock_maximo;

            return (
              <Card key={item.producto_id} className="p-4 sm:p-5 flex items-center gap-4 bg-[#FDFBF7] rounded-[26px]">
                {/* Imagen */}
                <div className="w-20 h-20 rounded-2xl bg-[#F3EDE2] overflow-hidden shrink-0 border border-[#EAE1D3]">
                  {item.imagen_url ? (
                    <img
                      src={item.imagen_url}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#1F1E1D] text-sm sm:text-base truncate tracking-tight">
                    {item.nombre}
                  </h4>
                  <p className="text-xs text-[#6E6862] mt-0.5 font-medium">
                    {formatPrice(item.precio_unitario)} c/u
                  </p>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-[#DECFC0] rounded-xl bg-[#FAF5ED] shadow-xs">
                      <button
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                        className="p-1.5 text-[#6E6862] hover:text-[#1F1E1D] hover:bg-[#EFE6DA] rounded-l-xl transition-colors cursor-pointer"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#1F1E1D]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                        disabled={!puedeAumentar}
                        className="p-1.5 text-[#6E6862] hover:text-[#1F1E1D] hover:bg-[#EFE6DA] rounded-r-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => quitar(item.producto_id)}
                      className="text-[#8C827A] hover:text-[#BF3E34] p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#8C827A] block font-semibold uppercase tracking-wider">Subtotal</span>
                  <span className="text-base font-black text-[#B84A1C]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Resumen de Compra */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-[#FDFBF7] space-y-6 sticky top-28 rounded-[28px] border-[#EAE1D3]">
            <h3 className="text-lg font-bold text-[#1F1E1D] border-b border-[#EAE1D3] pb-3 tracking-tight">
              Resumen de compra
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#6E6862]">
                <span>Subtotal productos</span>
                <span className="font-semibold text-[#1F1E1D]">{formatPrice(totalCalculado)}</span>
              </div>
              <div className="flex justify-between text-[#6E6862]">
                <span>Costo de envío</span>
                <span className="font-bold text-[#2D6A4F]">¡Gratis!</span>
              </div>
              <div className="pt-3 border-t border-[#EAE1D3] flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#1F1E1D]">Total final</span>
                <span className="text-2xl font-black text-[#B84A1C]">{formatPrice(totalCalculado)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full py-3.5 text-base font-bold shadow-amber-pill rounded-2xl"
              onClick={handleCheckoutClick}
            >
              Continuar al Checkout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {!usuario && (
              <p className="text-[11px] text-center text-[#B84A1C] bg-[#FBECE1] p-2.5 rounded-xl font-medium">
                * Se te solicitará iniciar sesión antes de confirmar la entrega.
              </p>
            )}

            <div className="pt-2 text-center">
              <Link to="/" className="text-xs text-[#8C827A] hover:text-[#1F1E1D] hover:underline font-medium">
                ← Continuar comprando en el catálogo
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
