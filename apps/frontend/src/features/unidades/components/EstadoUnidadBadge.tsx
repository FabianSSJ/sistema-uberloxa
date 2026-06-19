import type { MouseEvent } from 'react';
import { useCambiarEstadoUnidad } from '../hooks/useUnidades';
import type { EstadoUnidad } from '../services/unidades.service';

/**
 * Estilos por estado de unidad: UNA sola fuente de verdad para todo el sistema.
 * Si manana cambia el color del 'ocupado', se cambia aca y se actualiza en todos lados.
 */
export const ESTADO_UNIDAD_STYLES: Record<EstadoUnidad, { label: string; dot: string; pill: string; avatar: string }> = {
  disponible: { label: 'Disponible', dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700', avatar: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500' },
  ocupado:    { label: 'Ocupado',    dot: 'bg-amber-500',   pill: 'bg-amber-100 text-amber-700',     avatar: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500' },
  inactivo:   { label: 'Inactivo',   dot: 'bg-gray-400',    pill: 'bg-gray-200 text-gray-600',       avatar: 'bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-gray-400' },
};

/** Regla del toggle de la Charlie/admin: marca 'disponible', salvo que ya lo este -> 'inactivo'. */
export const nextEstadoToggle = (estado: EstadoUnidad): EstadoUnidad =>
  estado === 'disponible' ? 'inactivo' : 'disponible';

interface EstadoUnidadBadgeProps {
  unidad: { id: number; estado?: EstadoUnidad };
  /** Si es true, al clickear cambia el estado segun la regla del toggle. */
  interactive?: boolean;
  className?: string;
}

export const EstadoUnidadBadge = ({ unidad, interactive = false, className = '' }: EstadoUnidadBadgeProps) => {
  const cambiarEstado = useCambiarEstadoUnidad();
  const estado: EstadoUnidad = unidad.estado || 'disponible';
  const s = ESTADO_UNIDAD_STYLES[estado];

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation(); // no disparar clicks del contenedor (ej. la tarjeta)
    cambiarEstado.mutate({ id: unidad.id, estado: nextEstadoToggle(estado) });
  };

  return (
    <span
      onClick={interactive ? handleClick : undefined}
      title={interactive ? 'Click para cambiar estado' : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.pill} ${interactive ? 'cursor-pointer hover:brightness-95 transition' : ''} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};
