import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unidadesService, CreateUnidadDto, EstadoUnidad } from '../services/unidades.service';
import { notify } from '../../../components/ui/toast';

export const useUnidades = () => {
  return useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      const data = await unidadesService.getAll();
      return data.sort((a: any, b: any) => {
        const numA = parseInt(a.numeroUnidad) || a.id;
        const numB = parseInt(b.numeroUnidad) || b.id;
        return numA - numB;
      });
    },
    // Polling: refresca el estado de las unidades en ~1s aunque lo cambie otro usuario (Charlie/admin).
    refetchInterval: 1000,
  });
};

export const useCreateUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unidadesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      notify.success('Unidad creada con éxito');
    },
  });
};

export const useUpdateUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateUnidadDto> }) =>
      unidadesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      notify.success('Unidad actualizada');
    },
  });
};

export const useDeleteUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unidadesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      notify.success('Unidad eliminada');
    },
  });
};

const ESTADO_LABEL: Record<EstadoUnidad, string> = {
  disponible: 'Unidad disponible',
  ocupado: 'Unidad ocupada',
  inactivo: 'Unidad inactiva',
};

export const useCambiarEstadoUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoUnidad }) =>
      unidadesService.cambiarEstado(id, estado),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      notify.success(ESTADO_LABEL[variables.estado]);
    },
  });
};
