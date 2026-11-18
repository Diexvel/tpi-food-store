import { axiosInstance } from '../../../shared/api/axiosInstance';
import {
  Producto,
  ProductoCreate,
  ProductosFiltros,
  ProductosPaginados,
  ProductoStockUpdate,
  ProductoUpdate,
} from '../types';

export const productosApi = {
  getProductos: async (filtros: ProductosFiltros = {}): Promise<ProductosPaginados> => {
    const params = new URLSearchParams();
    if (filtros.skip !== undefined) params.append('skip', filtros.skip.toString());
    if (filtros.limit !== undefined) params.append('limit', filtros.limit.toString());
    if (filtros.search) params.append('search', filtros.search);
    if (filtros.categoria_id !== undefined) params.append('categoria_id', filtros.categoria_id.toString());
    if (filtros.disponible !== undefined) params.append('disponible', filtros.disponible.toString());

    const response = await axiosInstance.get<ProductosPaginados>('/productos', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await axiosInstance.get<Producto>(`/productos/${id}`);
    return response.data;
  },

  create: async (data: ProductoCreate): Promise<Producto> => {
    const response = await axiosInstance.post<Producto>('/productos', data);
    return response.data;
  },

  update: async (id: number, data: ProductoUpdate): Promise<Producto> => {
    const response = await axiosInstance.put<Producto>(`/productos/${id}`, data);
    return response.data;
  },

  updateStock: async (id: number, data: ProductoStockUpdate): Promise<Producto> => {
    const response = await axiosInstance.patch<Producto>(`/productos/${id}/stock`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/productos/${id}`);
  },
};
