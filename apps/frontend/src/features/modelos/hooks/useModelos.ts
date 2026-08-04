import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelosService, CreateModeloDto } from '../services/modelos.service';
import { notify } from '../../../components/ui/toast';

export const useModelos = () => {
  return useQuery({
    queryKey: ['modelos'],
    queryFn: modelosService.getAll,
  });
};

export const useCreateModelo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: modelosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] });
      notify.success('Modelo creado con éxito');
    },
  });
};

export const useUpdateModelo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateModeloDto> }) =>
      modelosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] });
      notify.success('Modelo actualizado');
    },
  });
};

export const useDeleteModelo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: modelosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] });
      notify.success('Modelo eliminado');
    },
  });
};
