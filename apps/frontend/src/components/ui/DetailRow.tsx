import type { ReactNode } from 'react';

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

/** Fila de icono + etiqueta + valor usada en los modales de detalle (Unidad, Carrera). */
export const DetailRow = ({ icon, label, value }: DetailRowProps) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <div className="text-gray-400 shrink-0">{icon}</div>
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 shrink-0">{label}</span>
    <span className="text-sm font-bold text-gray-800 flex-1 text-right min-w-0">{value}</span>
  </div>
);
