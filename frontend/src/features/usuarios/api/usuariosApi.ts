import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Usuario } from '../types';

export const usuariosApi = {
  getUsuarios: async (): Promise<Usuario[]> => {
    const response = await axiosInstance.get<Usuario[]>('/admin/usuarios');
    return response.data;
  },

  activar: async (id: number): Promise<Usuario> => {
    const response = await axiosInstance.post<Usuario>(`/admin/usuarios/${id}/activar`);
    return response.data;
  },

  desactivar: async (id: number): Promise<Usuario> => {
    const response = await axiosInstance.post<Usuario>(`/admin/usuarios/${id}/desactivar`);
    return response.data;
  },
};
