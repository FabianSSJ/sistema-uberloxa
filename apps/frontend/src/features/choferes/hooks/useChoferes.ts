import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { choferesService } from '../services/choferes.service';

export const useChoferes = () => {
  return useQuery({
    queryKey: ['choferes'],
    queryFn: choferesService.getAll,
  });
};

export const useCreateChofer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: choferesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choferes'] });
    },
  });
};

export const useUpdateChofer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      choferesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choferes'] });
    },
  });
};

export const useDeleteChofer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: choferesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choferes'] });
    },
  });
};
