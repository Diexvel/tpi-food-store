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
    <Card hoverEffect className="flex flex-col h-full bg-white">
      {/* Imagen con badge */}
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-amber-50/50">
            🍽️
          </div>
        )}

        {/* Categoria Badge */}
        {producto.categoria && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-stone-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs border border-stone-200">
            {producto.categoria.nombre}
          </span>
        )}

        {/* Estado badge si no está disponible o sin stock */}
        {(noDisponible || sinStock) && (
          <span className="absolute top-3 right-3 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            {noDisponible ? 'No disponible' : 'Sin stock'}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-base text-stone-900 line-clamp-1" title={producto.nombre}>
              {producto.nombre}
            </h3>
          </div>

          {producto.descripcion && (
            <p className="text-xs text-stone-500 line-clamp-2 mb-4" title={producto.descripcion}>
              {producto.descripcion}
            </p>
          )}
        </div>

        {/* Pie de tarjeta: precio y botón de agregar */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-stone-400 block font-medium">Precio</span>
            <span className="text-lg font-bold text-stone-900 leading-tight">
              {precioFormateado}
            </span>
            {producto.stock > 0 && producto.stock <= 5 && (
              <span className="text-[10px] text-amber-700 font-medium block">
                ¡Solo quedan {producto.stock}!
              </span>
            )}
          </div>

          <Button
            size="sm"
            variant={agregadoAnim ? 'secondary' : 'primary'}
            disabled={!puedeComprar}
            onClick={handleAgregar}
            className="shrink-0"
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
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-xs">¡Agregado!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="text-xs font-semibold">Agregar</span>
                {cantidadEnCarrito > 0 && (
                  <span className="ml-1 bg-amber-800/80 px-1.5 py-0.2 rounded-full text-[10px]">
                    {cantidadEnCarrito}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>

        {stockAgotadoEnCarrito && (
          <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Límite de stock en tu carrito
          </p>
        )}
      </div>
    </Card>
  );
};
