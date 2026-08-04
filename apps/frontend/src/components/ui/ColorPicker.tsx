import React from 'react';
import { Check, Pipette } from 'lucide-react';
import { PALETAS, esHex, getPaleta } from '../../core/operadores/colores';

interface ColorPickerProps {
  label?: string;
  /** valor seleccionado: key de preset ('verde') o hex libre ('#3fce88') o null = sin color */
  value?: string | null;
  onChange: (valor: string | null) => void;
  /** incluir la opción "Sin color" (gris). Default: true */
  allowNone?: boolean;
}

/**
 * Selector de color de identidad. Muestra los presets de acceso rápido (paleta fija) y,
 * al final, un CUADRO DE COLOR LIBRE (espectro nativo del SO) para elegir cualquier color.
 * Emite la `key` del preset o el `hex` libre; el contraste del texto se calcula solo aguas abajo.
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, allowNone = true }) => {
  const esLibre = esHex(value);
  // color con el que abre el picker nativo: el hex libre, el del preset elegido, o un azul por defecto
  const hexActual = esLibre ? (value as string) : value ? getPaleta(value).base ?? '#3b82f6' : '#3b82f6';

  const onHexInput = (raw: string) => {
    const v = raw.startsWith('#') ? raw : `#${raw}`;
    if (esHex(v)) onChange(v);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div className="flex flex-wrap gap-2 items-center">
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Sin color"
            className={`h-8 w-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 transition-transform hover:scale-110 ${
              !value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
            }`}
          >
            {!value ? <Check size={16} /> : <span className="text-xs font-bold">∅</span>}
          </button>
        )}

        {PALETAS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            title={p.label}
            style={{ backgroundColor: p.hex }}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 border border-black/10 ${
              value === p.key ? 'ring-2 ring-offset-2 ring-gray-500' : ''
            }`}
          >
            {value === p.key && <Check size={16} style={{ color: getPaleta(p.key).card.color as string }} />}
          </button>
        ))}

        {/* Color libre: el cuadro de espectro nativo del SO */}
        <label
          title="Color personalizado"
          className={`relative h-8 w-8 rounded-full cursor-pointer flex items-center justify-center overflow-hidden transition-transform hover:scale-110 border border-black/10 ${
            esLibre ? 'ring-2 ring-offset-2 ring-gray-500' : ''
          }`}
          style={esLibre ? { backgroundColor: value as string } : undefined}
        >
          {!esLibre && (
            <span
              className="absolute inset-0"
              style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
            />
          )}
          <Pipette
            size={14}
            className="relative"
            style={{ color: esLibre ? (getPaleta(value as string).card.color as string) : '#ffffff' }}
          />
          <input
            type="color"
            value={hexActual}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>

      {esLibre && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span>Personalizado:</span>
          <input
            type="text"
            value={value as string}
            onChange={(e) => onHexInput(e.target.value)}
            maxLength={7}
            className="w-24 font-mono uppercase px-2 py-1 rounded border border-gray-300 focus:border-gray-500 outline-none"
          />
          <span
            className="inline-block h-4 w-4 rounded-full border border-black/10"
            style={{ backgroundColor: value as string }}
          />
        </div>
      )}
    </div>
  );
};
