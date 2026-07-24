import { useMemo } from 'react';
import { useUnidades } from './useUnidades';
import { usePanelCarreras } from '../../carreras/hooks/useCarreras';
import { esHoy } from '../../../core/tiempo';
import type { Unidad } from '../services/unidades.service';

/**
 * Cola de despacho: única fuente de verdad para el orden y el estado operativo de las unidades.
 * Reutilizable por la página de Unidades (Asignación) y por el dashboard del Charlie.
 *
 *  - `activas`     : unidades en la cola (activadoEn != null), ordenadas FIFO por activadoEn.
 *  - `inactivas`   : unidades fuera de la cola (disponibles para activar).
 *  - `proximaId`   : primera de la cola que esté 'disponible' (la próxima a despachar).
 *  - `carrerasHoy` : Map unidadId -> cantidad de carreras de HOY (cualquier estado).
 */
export const useColaDespacho = () => {
  const { data: unidades = [], isLoading, isError } = useUnidades();
  const { data: carreras = [] } = usePanelCarreras();

  return useMemo(() => {
    const carrerasHoy = new Map<number, number>();
    for (const c of carreras as any[]) {
      const uid = c.unidad?.id ?? c.unidadId;
      if (uid && esHoy(c.createdAt)) carrerasHoy.set(uid, (carrerasHoy.get(uid) || 0) + 1);
    }

    const activas = (unidades as Unidad[])
      .filter((u) => u.activadoEn)
      .sort((a, b) => {
        const ta = new Date(a.activadoEn as string).getTime();
        const tb = new Date(b.activadoEn as string).getTime();
        return ta !== tb ? ta - tb : a.id - b.id;
      });

    const inactivas = (unidades as Unidad[]).filter((u) => !u.activadoEn);
    const proxima = activas.find((u) => (u.estado || 'disponible') === 'disponible');

    return {
      unidades: unidades as Unidad[],
      activas,
      inactivas,
      carrerasHoy,
      proximaId: proxima?.id ?? null,
      isLoading,
      isError,
    };
  }, [unidades, carreras, isLoading, isError]);
};
