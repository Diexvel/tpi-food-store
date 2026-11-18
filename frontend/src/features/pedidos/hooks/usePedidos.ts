import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedidosApi } from '../api/pedidosApi';
import { PedidoCreate } from '../types';

export const PEDIDOS_QUERY_KEY = ['pedidos'];

export function usePedidos(params?: { skip?: number; limit?: number; estado?: string }) {
  return useQuery({
    queryKey: ['pedidos', params],
    queryFn: () => pedidosApi.getPedidos(params),
  });
}

export function usePedidoDetalle(id: number) {
  return useQuery({
    queryKey: ['pedidos', id],
    queryFn: () => pedidosApi.getPedidoById(id),
    enabled: !!id,
  });
}

export function useCrearPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PedidoCreate) => pedidosApi.crearPedido(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useCancelarPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pedidosApi.cancelarPedidoCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useCambiarEstadoPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      pedidosApi.cambiarEstadoAdmin(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useResumenPedidos() {
  return useQuery({
    queryKey: ['pedidos', 'resumen'],
    queryFn: pedidosApi.getResumenAdmin,
  });
}
