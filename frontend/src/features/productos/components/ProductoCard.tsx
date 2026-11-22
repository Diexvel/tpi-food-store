import React, { useState } from 'react';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { Producto } from '../types';
import { useCartStore } from '../../../store/cartStore';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';

interface ProductoCardProps {
  producto: Producto;
}

export const ProductoCard: React.FC<ProductoCardProps> = ({ producto }) => {
  const agregarAlCarrito = useCartStore((state) => state.agregar);
  const itemsEnCarrito = useCartStore((state) => state.items);
  const [agregadoAnim, setAgregadoAnim] = useState(false);

  const cartItem = itemsEnCarrito.find((i) => i.producto_id === producto.id);
  const cantidadEnCarrito = cartItem ? cartItem.cantidad : 0;
  const sinStock = producto.stock <= 0;
  const noDisponible = !producto.disponible;
  const stockAgotadoEnCarrito = cantidadEnCarrito >= producto.stock;
  const puedeComprar = !sinStock && !noDisponible && !stockAgotadoEnCarrito;

  const handleAgregar = () => {
    if (!puedeComprar) return;
    agregarAlCarrito(producto, 1);
    setAgregadoAnim(true);
    setTimeout(() => setAgregadoAnim(false), 900);
  };

  const precioFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(producto.precio_base);

  return (
    <Card hoverEffect className="flex flex-col h-full bg-[#FDFBF7] p-3.5 rounded-[28px]">
      {/* Imagen con badge */}
      <div className="relative h-48 w-full bg-[#F3EDE2] rounded-[22px] overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-[#FAF5ED]">
            🍽️
          </div>
        )}

        {/* Categoria Badge estilo pastilla Ivory */}
        {producto.categoria && (
          <span className="absolute top-3 left-3 bg-[#FDFBF7]/90 backdrop-blur-xs text-[#1F1E1D] text-[11px] font-bold px-3 py-1 rounded-full shadow-xs border border-[#DECFC0]">
            {producto.categoria.nombre}
          </span>
        )}

        {/* Estado badge si no está disponible o sin stock */}
        {(noDisponible || sinStock) && (
          <span className="absolute top-3 right-3 bg-[#BF3E34] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
            {noDisponible ? 'No disponible' : 'Sin stock'}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-base text-[#1F1E1D] line-clamp-1 tracking-tight" title={producto.nombre}>
              {producto.nombre}
            </h3>
          </div>

          {producto.descripcion && (
            <p className="text-xs text-[#6E6862] line-clamp-2 mb-4 leading-relaxed" title={producto.descripcion}>
              {producto.descripcion}
            </p>
          )}
        </div>

        {/* Pie de tarjeta: precio y botón de agregar */}
        <div className="pt-3 border-t border-[#EAE1D3] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#8C827A] block font-semibold uppercase tracking-wider">Precio</span>
            <span className="text-xl font-black text-[#B84A1C] leading-tight">
              {precioFormateado}
            </span>
            {producto.stock > 0 && producto.stock <= 5 && (
              <span className="text-[10px] text-[#E88C4D] font-bold block">
                ¡Solo quedan {producto.stock}!
              </span>
            )}
          </div>

          <Button
            size="sm"
            variant={agregadoAnim ? 'secondary' : 'primary'}
            disabled={!puedeComprar}
            onClick={handleAgregar}
            className="shrink-0 rounded-2xl"
            title={
              sinStock
                ? 'Producto agotado'
                : noDisponible
                ? 'Producto no disponible'
                : stockAgotadoEnCarrito
                ? 'Has alcanzado el stock disponible'
                : 'Agregar al carrito'
            }
          >
            {agregadoAnim ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">¡Listo!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="text-xs">Agregar</span>
                {cantidadEnCarrito > 0 && (
                  <span className="ml-1 bg-white/25 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {cantidadEnCarrito}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>

        {stockAgotadoEnCarrito && (
          <p className="text-[10px] text-[#B84A1C] flex items-center gap-1 mt-2 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Límite de stock en tu carrito
          </p>
        )}
      </div>
    </Card>
  );
};
