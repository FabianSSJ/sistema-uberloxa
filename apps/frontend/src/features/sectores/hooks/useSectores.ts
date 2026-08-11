import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectoresService } from '../services/sectores.service';

export const useSectores = () => {
  return useQuery({
    queryKey: ['sectores'],
    queryFn: sectoresService.getAll,
  });
};

export const useCreateSector = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string }) =>
      sectoresService.create(data.nombre, data.descripcion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectores'] });
    },
  });
};
