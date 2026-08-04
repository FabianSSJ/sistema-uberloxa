/**
 * MOTOR DE COLOR DE IDENTIDAD: una sola fuente de verdad para los colores de
 * Charlies (operadores) y de unidades de taxi.
 *
 * El color se guarda en la DB como un string que puede ser:
 *   - una `key` de preset estable (ej: 'verde', 'azul') — acceso rápido, y
 *   - un HEX libre elegido con el picker (ej: '#3fce88').
 *
 * De ese color base se DERIVA todo por matemática (relleno, contraste de texto,
 * tinte suave, borde) con estilos INLINE. Nada de clases de Tailwind en runtime:
 * un hex arbitrario nunca podría ser `bg-[#...]` pre-generado, así que el motor
 * devuelve objetos `CSSProperties` que funcionan igual para presets y para hex.
 */
import type { CSSProperties } from 'react';

// ---------------------------------------------------------------------------
// Matemática de color (todo derivado del hex base)
// ---------------------------------------------------------------------------

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** ¿Es un hex válido (#rgb o #rrggbb)? */
export const esHex = (v?: string | null): v is string => !!v && HEX_RE.test(v.trim());

const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const rgbToHex = ([r, g, b]: [number, number, number]) =>
  '#' + [r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('');

/** Mezcla lineal de dos hex (t=0 → a, t=1 → b). */
const mix = (a: string, b: string, t: number): string => {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  return rgbToHex([
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t,
  ]);
};

/** Luminancia relativa (WCAG) 0..1 — sirve para decidir contraste. */
const luminancia = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Texto que contrasta sobre un relleno FUERTE del color: blanco en oscuros, casi-negro en claros. */
const textoContraste = (hex: string): string => (luminancia(hex) > 0.5 ? '#111827' : '#ffffff');

/** Versión del color LEGIBLE sobre fondo blanco (para títulos/íconos/badges). Oscurece si es muy claro. */
const legibleEnBlanco = (hex: string): string => {
  const l = luminancia(hex);
  if (l > 0.6) return mix(hex, '#000000', 0.55);
  if (l > 0.4) return mix(hex, '#000000', 0.3);
  return hex;
};

/** Tinte MUY suave (equivalente a un shade -50): el color mezclado con mucho blanco. */
const tinte = (hex: string): string => mix(hex, '#ffffff', 0.86);

// ---------------------------------------------------------------------------
// Presets: solo {key, label, hex}. Todo lo demás se deriva.
// ---------------------------------------------------------------------------

export interface Preset {
  key: string;
  label: string;
  hex: string;
}

/** Paleta fija de acceso rápido. El ORDEN es el que se muestra en el picker. */
export const PALETAS: Preset[] = [
  { key: 'verde',     label: 'Verde',          hex: '#22c55e' },
  { key: 'azul',      label: 'Azul',           hex: '#3b82f6' },
  { key: 'negro',     label: 'Negro',          hex: '#111827' },
  { key: 'rojo',      label: 'Rojo',           hex: '#ef4444' },
  { key: 'naranja',   label: 'Naranja',        hex: '#f97316' },
  { key: 'violeta',   label: 'Violeta',        hex: '#a855f7' },
  { key: 'celeste',   label: 'Celeste',        hex: '#0ea5e9' },
  { key: 'amarillo',  label: 'Amarillo',       hex: '#f59e0b' },
  { key: 'rosa',      label: 'Rosa',           hex: '#ec4899' },
  { key: 'turquesa',  label: 'Turquesa',       hex: '#14b8a6' },
  { key: 'indigo',    label: 'Índigo',         hex: '#6366f1' },
  { key: 'gris',      label: 'Gris',           hex: '#64748b' },
  { key: 'vino',      label: 'Concho de Vino', hex: '#9f1239' },
  { key: 'dorado',    label: 'Dorado',         hex: '#ca8a04' },
  { key: 'plata',     label: 'Plata / Plomo',  hex: '#9ca3af' },
  { key: 'esmeralda', label: 'Esmeralda',      hex: '#10b981' },
  { key: 'lima',      label: 'Lima',           hex: '#84cc16' },
  { key: 'fucsia',    label: 'Fucsia',         hex: '#d946ef' },
  { key: 'marrón',    label: 'Marrón / Café',  hex: '#57534e' },
  { key: 'blanco',    label: 'Blanco',         hex: '#f3f4f6' },
];

const PRESET_POR_KEY = new Map(PALETAS.map((p) => [p.key, p]));

// ---------------------------------------------------------------------------
// Identidad: descriptor con estilos inline, derivado del color base
// ---------------------------------------------------------------------------

export interface Identidad {
  /** valor original guardado en DB ('verde' | '#3fce88' | '') — para comparar selección */
  key: string;
  /** hex base del color, o null si es neutro (sin color) */
  base: string | null;
  /** etiqueta legible: nombre del preset, 'Personalizado' (hex) o 'Sin color' */
  label: string;
  /** relleno FUERTE + texto que contrasta (cuadradito de unidad) */
  card: CSSProperties;
  /** borde izquierdo del color (card de carrera / lista) */
  borderLeft: CSSProperties;
  /** color de texto legible sobre blanco (títulos, íconos) */
  textColor: CSSProperties;
  /** puntito / swatch sólido del color */
  swatch: CSSProperties;
  /** tinte suave de fondo */
  tintBg: CSSProperties;
  /** badge/avatar: fondo tinte + texto legible */
  badge: CSSProperties;
}

const NEUTRO: Identidad = {
  key: '',
  base: null,
  label: 'Sin color',
  card: { backgroundColor: '#ffffff', color: '#111827' },
  borderLeft: { borderLeftColor: '#d1d5db' },
  textColor: { color: '#4b5563' },
  swatch: { backgroundColor: '#d1d5db' },
  tintBg: { backgroundColor: '#f9fafb' },
  badge: { backgroundColor: '#f3f4f6', color: '#4b5563' },
};

/** Neutro exportado para operadores/unidades SIN color (admin, sistema, null). */
export const NEUTRAL = NEUTRO;

/** Construye el descriptor de identidad a partir de un hex base. */
const desdeHex = (key: string, base: string, label: string): Identidad => {
  const legible = legibleEnBlanco(base);
  const suave = tinte(base);
  return {
    key,
    base,
    label,
    card: { backgroundColor: base, color: textoContraste(base) },
    borderLeft: { borderLeftColor: base },
    textColor: { color: legible },
    swatch: {
      backgroundColor: base,
      // si es muy claro (blanco), un borde para que no se pierda en fondo blanco
      ...(luminancia(base) > 0.85 ? { border: '1px solid #d1d5db' } : {}),
    },
    tintBg: { backgroundColor: suave },
    badge: { backgroundColor: suave, color: legible },
  };
};

/**
 * Resuelve un valor guardado (preset key o hex) al descriptor de identidad.
 * Sin valor conocido → neutro. Nunca rompe.
 */
export const getPaleta = (valor?: string | null): Identidad => {
  if (!valor) return NEUTRO;
  const v = valor.trim();
  if (esHex(v)) return desdeHex(v, v, 'Personalizado');
  const preset = PRESET_POR_KEY.get(v);
  if (preset) return desdeHex(preset.key, preset.hex, preset.label);
  return NEUTRO;
};

// --- Fallback legado por NOMBRE (mientras existan Charlies sin `color` en DB) ---
const LEGADO_POR_NOMBRE: Record<string, string> = {
  carmita: 'verde',
  alejandra: 'azul',
  gabriel: 'negro',
  kathia: 'rojo',
};

const normalizar = (v: unknown): string =>
  (v == null ? '' : String(v))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/**
 * Identidad de un OPERADOR (Charlie). Prioriza el `color` guardado en DB (preset o hex);
 * si no lo tiene, cae al mapeo legado por nombre; si nada matchea (admin, sistema) → neutro.
 */
export const colorOperador = (
  operador?: { color?: string | null; nombre?: string | null } | null,
): Identidad => {
  if (!operador) return NEUTRO;
  if (operador.color) return getPaleta(operador.color);
  const n = normalizar(operador.nombre);
  for (const key of Object.keys(LEGADO_POR_NOMBRE)) {
    if (n === key || n.split(/\s+/).includes(key)) return getPaleta(LEGADO_POR_NOMBRE[key]);
  }
  return NEUTRO;
};

/** Identidad de una UNIDAD según su color (preset o hex en DB). */
export const colorUnidad = (
  unidad?: { colorIdentidad?: string | null } | null,
): Identidad => getPaleta(unidad?.colorIdentidad);
