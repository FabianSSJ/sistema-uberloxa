import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unidadesService, CreateUnidadDto } from '../services/unidades.service';

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
  });
};

export const useCreateUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unidadesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
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
    },
  });
};

export const useDeleteUnidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unidadesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
    },
  });
};
