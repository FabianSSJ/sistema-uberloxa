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

// 'unidades' para los consumidores directos (selects de modales, UnidadesPage) y
// ['carreras','panelCompleto'] porque useColaDespacho (dashboard del Charlie) ya no lee
// 'unidades' directamente — sin esto, un cambio de estado tardaría hasta 1s (el poll) en
// verse ahí en vez de reflejarse al toque.
const invalidarUnidades = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['unidades'] });
  queryClient.invalidateQueries({ queryKey: ['carreras', 'panelCompleto'] });
};

export const useCreateUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unidadesService.create,
    onSuccess: () => {
      invalidarUnidades(queryClient);
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
      invalidarUnidades(queryClient);
      notify.success('Unidad actualizada');
    },
  });
};

export const useDeleteUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unidadesService.delete,
    onSuccess: () => {
      invalidarUnidades(queryClient);
      notify.success('Unidad eliminada');
    },
  });
};

const ESTADO_LABEL: Record<EstadoUnidad, string> = {
  disponible: 'Unidad disponible',
  ocupado: 'Unidad ocupada',
  descanso: 'Unidad en descanso',
  inactivo: 'Unidad inactiva',
};

export const useCambiarEstadoUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoUnidad }) =>
      unidadesService.cambiarEstado(id, estado),
    onSuccess: (_data, variables) => {
      invalidarUnidades(queryClient);
      notify.success(ESTADO_LABEL[variables.estado]);
    },
  });
};
