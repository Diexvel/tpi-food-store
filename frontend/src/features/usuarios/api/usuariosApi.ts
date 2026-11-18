import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Usuario, UsuariosPaginados } from '../types';

export const usuariosApi = {
  getUsuarios: async (params?: { skip?: number; limit?: number }): Promise<UsuariosPaginados> => {
    const qp = new URLSearchParams();
    if (params?.skip !== undefined) qp.append('skip', String(params.skip));
    if (params?.limit !== undefined) qp.append('limit', String(params.limit));
    const response = await axiosInstance.get<UsuariosPaginados>('/admin/usuarios', { params: qp });
    return response.data;
  },

  activar: async (id: number): Promise<Usuario> => {
    const response = await axiosInstance.patch<Usuario>(`/admin/usuarios/${id}/activar`);
    return response.data;
  },

  desactivar: async (id: number): Promise<Usuario> => {
    const response = await axiosInstance.patch<Usuario>(`/admin/usuarios/${id}/desactivar`);
    return response.data;
  },
};
