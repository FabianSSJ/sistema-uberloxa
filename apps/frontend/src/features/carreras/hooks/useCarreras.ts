import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService, CreateCarreraDto } from '../services/carreras.service';

export const useCarreras = () => {
  return useQuery({
    queryKey: ['carreras'],
    queryFn: carrerasService.getAll,
  });
};

export const useRecentCarreras = () => {
  return useQuery({
    queryKey: ['carreras', 'recent'],
    queryFn: carrerasService.getRecent,
  });
};

export const useCreateCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarreraDto) => carrerasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carreras'] });
      queryClient.invalidateQueries({ queryKey: ['carreras', 'recent'] });
    },
  });
};

export const useCompletarCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, unidadId }: { id: number; unidadId?: number }) =>
      carrerasService.completar(id, unidadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carreras'] });
      queryClient.invalidateQueries({ queryKey: ['carreras', 'recent'] });
    },
  });
};

export const useCancelarCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => carrerasService.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carreras'] });
      queryClient.invalidateQueries({ queryKey: ['carreras', 'recent'] });
    },
  });
};

export const usePerderCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => carrerasService.perder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carreras'] });
      queryClient.invalidateQueries({ queryKey: ['carreras', 'recent'] });
    },
  });
};

