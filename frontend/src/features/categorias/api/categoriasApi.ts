import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Categoria, CategoriaCreate, CategoriaUpdate } from '../types';

export const categoriasApi = {
  getActivas: async (): Promise<Categoria[]> => {
    const response = await axiosInstance.get<Categoria[]>('/categorias');
    return response.data;
  },

  getById: async (id: number): Promise<Categoria> => {
    const response = await axiosInstance.get<Categoria>(`/categorias/${id}`);
    return response.data;
  },

  create: async (data: CategoriaCreate): Promise<Categoria> => {
    const response = await axiosInstance.post<Categoria>('/categorias', data);
    return response.data;
  },

  update: async (id: number, data: CategoriaUpdate): Promise<Categoria> => {
    const response = await axiosInstance.put<Categoria>(`/categorias/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categorias/${id}`);
  },
};
