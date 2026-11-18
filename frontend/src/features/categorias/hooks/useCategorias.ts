import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriasApi } from '../api/categoriasApi';
import { CategoriaCreate, CategoriaUpdate } from '../types';

export const CATEGORIAS_QUERY_KEY = ['categorias'];

export function useCategorias() {
  return useQuery({
    queryKey: CATEGORIAS_QUERY_KEY,
    queryFn: categoriasApi.getActivas,
  });
}

export function useCrearCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoriaCreate) => categoriasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIAS_QUERY_KEY });
    },
  });
}

export function useActualizarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaUpdate }) =>
      categoriasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIAS_QUERY_KEY });
    },
  });
}

export function useEliminarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIAS_QUERY_KEY });
    },
  });
}
