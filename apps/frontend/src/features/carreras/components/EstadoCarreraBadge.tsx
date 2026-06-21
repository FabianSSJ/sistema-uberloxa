export type EstadoCarrera = 'pendiente' | 'asignada' | 'completada' | 'cancelada' | 'perdida';

/**
 * Estilos por estado de carrera: UNA sola fuente de verdad para toda la app.
 * Los colores coinciden con las métricas del dashboard (perdida = naranja, no gris).
 *   pendiente / asignada = EN CURSO (no finalizadas)
 *   completada / cancelada / perdida = finales
 */
export const ESTADO_CARRERA_STYLES: Record<EstadoCarrera, string> = {
  pendiente:  'bg-amber-100 text-amber-800 border-amber-200',
  asignada:   'bg-blue-100 text-blue-800 border-blue-200',
  completada: 'bg-green-100 text-green-800 border-green-200',
  perdida:    'bg-orange-100 text-orange-800 border-orange-200',
  cancelada:  'bg-red-100 text-red-800 border-red-200',
};

interface EstadoCarreraBadgeProps {
  estado?: string;
  className?: string;
}

export const EstadoCarreraBadge = ({ estado, className = '' }: EstadoCarreraBadgeProps) => {
  const cls = ESTADO_CARRERA_STYLES[estado as EstadoCarrera] || 'bg-gray-200 text-gray-800 border-gray-300';
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap ${cls} ${className}`}>
      {String(estado || '').toUpperCase()}
    </span>
  );
};
