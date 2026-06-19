import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService, CreateCarreraDto } from '../services/carreras.service';
import { notify } from '../../../components/ui/toast';

export const useCarreras = () => {
  return useQuery({
    queryKey: ['carreras'],
    queryFn: carrerasService.getAll,
    // Polling: el tablero del Charlie se mantiene vivo (~1s) ante cambios de otros usuarios.
    refetchInterval: 1000,
  });
};

export const useRecentCarreras = () => {
  return useQuery({
    queryKey: ['carreras', 'recent'],
    queryFn: carrerasService.getRecent,
    refetchInterval: 1000,
  });
};

const invalidarCarreras = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['carreras'] });
  queryClient.invalidateQueries({ queryKey: ['carreras', 'recent'] });
};

export const useCreateCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarreraDto) => carrerasService.create(data),
    onSuccess: () => {
      invalidarCarreras(queryClient);
      // La unidad pasa a 'ocupado' en el backend al asignarse: refrescamos su lista.
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      notify.success('Carrera registrada con éxito');
    },
  });
};

export const useCompletarCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, unidadId }: { id: number; unidadId?: number }) =>
      carrerasService.completar(id, unidadId),
    onSuccess: () => {
      invalidarCarreras(queryClient);
      notify.success('Carrera completada');
    },
  });
};

export const useCancelarCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => carrerasService.cancelar(id),
    onSuccess: () => {
      invalidarCarreras(queryClient);
      notify.success('Carrera cancelada');
    },
  });
};

export const usePerderCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => carrerasService.perder(id),
    onSuccess: () => {
      invalidarCarreras(queryClient);
      notify.success('Carrera marcada como perdida');
    },
  });
};

export const useDeleteCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => carrerasService.remove(id),
    onSuccess: () => {
      invalidarCarreras(queryClient);
      notify.success('Carrera eliminada');
    },
  });
};
