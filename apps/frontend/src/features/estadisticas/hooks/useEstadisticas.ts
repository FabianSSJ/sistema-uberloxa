import { useQuery } from '@tanstack/react-query';
import { estadisticasService } from '../services/estadisticas.service';

export const useEstadisticas = () => {
  return useQuery({
    queryKey: ['estadisticas', 'resumen'],
    queryFn: estadisticasService.getResumen,
    refetchInterval: 30000, // la analítica no necesita tiempo real estricto
  });
};

export const useRankingUnidades = (desde?: string, hasta?: string) => {
  return useQuery({
    queryKey: ['estadisticas', 'ranking-unidades', desde ?? '-', hasta ?? 'todo'],
    queryFn: () => estadisticasService.getRankingUnidades(desde, hasta),
  });
};
