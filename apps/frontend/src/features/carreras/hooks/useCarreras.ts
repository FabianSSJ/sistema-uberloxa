import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService, CreateCarreraDto, HistorialParams } from '../services/carreras.service';
import { notify } from '../../../components/ui/toast';

/**
 * Panel + unidades combinados en un solo poll de 1s (ver useColaDespacho, que es su único
 * consumidor). Antes existían dos hooks polleando cada 1s por separado (un usePanelCarreras
 * ya eliminado + useUnidades) — este endpoint combinado los reemplazó. useUnidades sigue
 * vivo aparte porque otros componentes lo siguen usando tal cual (selects de unidad en
 * modales, etc. no necesitan polling de 1s en primer lugar).
 */
export const usePanelCompleto = () => {
  return useQuery({
    queryKey: ['carreras', 'panelCompleto'],
    queryFn: carrerasService.getPanelCompleto,
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
// (las páginas reales usan usePanelCompleto / useCarrerasHistorial). Se deja solo para no
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

// Corrige la unidad de una carrera (pendiente, en curso o completada) sin cambiar su estado.
export const useReasignarUnidadCarrera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, unidadId }: { id: number; unidadId: number }) =>
      carrerasService.reasignarUnidad(id, unidadId),
    onSuccess: () => {
      invalidarCarreras(queryClient);
      notify.success('Unidad corregida con éxito');
    },
  });
};

// Reasigna+completa una carrera CANCELADA (drag&drop de una unidad sobre la tarjeta). Sin
// toast propio a propósito: el caller (CharlieDashboard) arma un mensaje con el número de
// unidad ("Carrera reasignada y completada con Unidad Nº X"), así que usa el mismo endpoint
// que useCompletarCarrera pero sin duplicar el aviso genérico de esa.
export const useReasignarCarreraCancelada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, unidadId }: { id: number; unidadId: number }) =>
      carrerasService.completar(id, unidadId),
    onSuccess: () => {
      invalidarCarreras(queryClient);
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
