import React from 'react';
import { Check } from 'lucide-react';
import { PALETAS } from '../../core/operadores/colores';

interface ColorPickerProps {
  label?: string;
  /** key de la paleta seleccionada (o null/'' = sin color) */
  value?: string | null;
  onChange: (key: string | null) => void;
  /** incluir la opción "Sin color" (gris). Default: true */
  allowNone?: boolean;
}

/**
 * Selector de color de identidad: muestra los swatches de la PALETA FIJA (única fuente
 * de verdad en core/operadores/colores). Guarda/emite la `key` de la paleta, no clases.
 * Reutilizable para Charlies y unidades.
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, allowNone = true }) => {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Sin color"
            className={`h-8 w-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 transition-transform hover:scale-110 ${
              !value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
            }`}
          >
            {!value && <Check size={16} />}
            {value && <span className="text-xs font-bold">∅</span>}
          </button>
        )}
        {PALETAS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            title={p.label}
            className={`h-8 w-8 rounded-full ${p.swatch} flex items-center justify-center text-white transition-transform hover:scale-110 ${
              value === p.key ? 'ring-2 ring-offset-2 ring-gray-500' : ''
            }`}
          >
            {value === p.key && <Check size={16} />}
          </button>
        ))}
      </div>
    </div>
  );
};
