import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marcasService, CreateMarcaDto } from '../services/marcas.service';
import { notify } from '../../../components/ui/toast';

export const useMarcas = () => {
  return useQuery({
    queryKey: ['marcas'],
    queryFn: marcasService.getAll,
  });
};

export const useCreateMarca = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marcasService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      notify.success('Marca creada con éxito');
    },
  });
};

export const useUpdateMarca = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateMarcaDto }) =>
      marcasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      notify.success('Marca actualizada');
    },
  });
};

export const useDeleteMarca = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marcasService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      notify.success('Marca eliminada');
    },
  });
};
