import { useQuery } from '@tanstack/react-query';
import { sectoresService } from '../services/sectores.service';

export const useSectores = () => {
  return useQuery({
    queryKey: ['sectores'],
    queryFn: sectoresService.getAll,
  });
};
