import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Pedido, PedidoCreate, PedidosPaginados, ResumenPedidos } from '../types';

export const pedidosApi = {
  crearPedido: async (data: PedidoCreate): Promise<Pedido> => {
    const response = await axiosInstance.post<Pedido>('/pedidos', data);
    return response.data;
  },

  getPedidos: async (params?: { skip?: number; limit?: number; estado?: string }): Promise<PedidosPaginados> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.estado) queryParams.append('estado', params.estado);

    const response = await axiosInstance.get<PedidosPaginados>('/pedidos', { params: queryParams });
    return response.data;
  },

  getPedidoById: async (id: number): Promise<Pedido> => {
    const response = await axiosInstance.get<Pedido>(`/pedidos/${id}`);
    return response.data;
  },

  cancelarPedidoCliente: async (id: number): Promise<Pedido> => {
    const response = await axiosInstance.patch<Pedido>(`/pedidos/${id}/cancelar`);
    return response.data;
  },

  cambiarEstadoAdmin: async (id: number, estado: string): Promise<Pedido> => {
    const response = await axiosInstance.patch<Pedido>(`/pedidos/${id}/estado`, { estado });
    return response.data;
  },

  getResumenAdmin: async (): Promise<ResumenPedidos> => {
    const response = await axiosInstance.get<ResumenPedidos>('/pedidos/resumen');
    return response.data;
  },
};
