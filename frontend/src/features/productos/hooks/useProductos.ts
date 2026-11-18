import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productosApi } from '../api/productosApi';
import { ProductoCreate, ProductosFiltros, ProductoStockUpdate, ProductoUpdate } from '../types';

export const PRODUCTOS_QUERY_KEY = ['productos'];

export function useProductos(filtros: ProductosFiltros = {}) {
  return useQuery({
    queryKey: [...PRODUCTOS_QUERY_KEY, filtros],
    queryFn: () => productosApi.getProductos(filtros),
  });
}

export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductoCreate) => productosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY });
    },
  });
}

export function useActualizarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoUpdate }) =>
      productosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY });
    },
  });
}

export function useActualizarStockProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoStockUpdate }) =>
      productosApi.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY });
    },
  });
}

export function useEliminarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY });
    },
  });
}
