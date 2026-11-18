import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  imagen_url?: string | null;
  stock_maximo?: number;
}

interface CartState {
  items: CartItem[];
  agregar: (producto: { id: number; nombre: string; precio_base: number; imagen_url?: string | null; stock: number }, cantidad?: number) => void;
  quitar: (producto_id: number) => void;
  cambiarCantidad: (producto_id: number, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      agregar: (producto, cantidad = 1) => {
        set((state) => {
          const index = state.items.findIndex((i) => i.producto_id === producto.id);
          if (index > -1) {
            const copia = [...state.items];
            const nuevaCantidad = copia[index].cantidad + cantidad;
            const cantidadFinal = producto.stock !== undefined ? Math.min(nuevaCantidad, producto.stock) : nuevaCantidad;
            copia[index] = {
              ...copia[index],
              cantidad: cantidadFinal,
            };
            return { items: copia };
          }
          return {
            items: [
              ...state.items,
              {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: producto.precio_base,
                cantidad: producto.stock !== undefined ? Math.min(cantidad, producto.stock) : cantidad,
                imagen_url: producto.imagen_url,
                stock_maximo: producto.stock,
              },
            ],
          };
        });
      },
      quitar: (producto_id: number) => {
        set((state) => ({
          items: state.items.filter((i) => i.producto_id !== producto_id),
        }));
      },
      cambiarCantidad: (producto_id: number, cantidad: number) => {
        if (cantidad <= 0) {
          get().quitar(producto_id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.producto_id === producto_id) {
              const cantAjustada = i.stock_maximo !== undefined ? Math.min(cantidad, i.stock_maximo) : cantidad;
              return { ...i, cantidad: cantAjustada };
            }
            return i;
          }),
        }));
      },
      vaciar: () => set({ items: [] }),
      total: () => {
        return get().items.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
      },
      totalItems: () => {
        return get().items.reduce((acc, item) => acc + item.cantidad, 0);
      },
    }),
    {
      name: 'foodstore-cart',
    }
  )
);
