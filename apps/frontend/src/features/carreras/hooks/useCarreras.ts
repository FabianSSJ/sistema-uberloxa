import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService, CreateCarreraDto, HistorialParams } from '../services/carreras.service';
import { notify } from '../../../components/ui/toast';

/**
 * Panel de despacho (dashboard del Charlie + cola de unidades): el server ya resuelve
 * "hoy + en proceso" con la ventana de gracia de 23:30-23:59 — acá solo se pollea (~1s)
 * un set siempre chico (nunca más de ~1 día de carreras), no el historial completo.
 */
export const usePanelCarreras = () => {
  return useQuery({
    queryKey: ['carreras', 'panel'],
    queryFn: carrerasService.getPanel,
    refetchInterval: 1000,
  });
};

/**
 * Historial paginado (keyset) con filtros de fecha opcionales. Sin polling: es una vista
 * de consulta, no un tablero en vivo — refrescar cada 1s acá sería re-traer páginas enteras
 * sin necesidad.
 */
export const useCarrerasHistorial = (filters: HistorialParams = {}) => {
  return useInfiniteQuery({
    queryKey: ['carreras', 'historial', filters],
    queryFn: ({ pageParam }) => carrerasService.getHistorial({ ...filters, cursor: pageParam as number | undefined }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

// Alias legacy sin filtros/paginación real — no queda ningún consumidor activo en la app
// (las páginas reales usan usePanelCarreras / useCarrerasHistorial). Se deja solo para no
// romper imports de módulos huérfanos (AsignarUnidadModal/NuevaCarreraModal, no routeados).
export const useCarreras = () => {
  return useQuery({
    queryKey: ['carreras', 'legacy'],
    queryFn: () => carrerasService.getHistorial({}),
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
