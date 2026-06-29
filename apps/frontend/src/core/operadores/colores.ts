/**
 * REGISTRO DE PALETAS DE IDENTIDAD: una sola fuente de verdad para los colores de
 * Charlies (operadores) y de unidades de taxi.
 *
 * El color se elige de una PALETA FIJA y se persiste en la DB como una `key` estable
 * (ej: 'verde', 'azul'). Acá se mapea esa key → clases de Tailwind para cada contexto
 * visual (borde de tarjeta, badge, avatar, swatch del picker, etc.).
 *
 * IMPORTANTE: las clases de Tailwind se escriben COMPLETAS, nunca concatenadas en runtime
 * (`bg-${c}-500` se purga del bundle). Por eso cada paleta lista sus clases una por una.
 * Agregar un color = sumar una entrada a PALETAS. Se propaga solo a todos los consumidores.
 */

export interface Paleta {
  /** key estable que se guarda en la DB */
  key: string;
  /** etiqueta para el picker */
  label: string;
  /** bg-* sólido para el swatch del selector y el puntito */
  swatch: string;
  /** border-l-*: borde izquierdo de la tarjeta de carrera */
  border: string;
  /** text-*: título / acento */
  text: string;
  /** text-*: íconos */
  icon: string;
  /** bg-* text-*: badge ("Operador", etiqueta de unidad) */
  badge: string;
  /** bg-* text-*: avatar redondo de reportes */
  avatar: string;
}

/** Paleta neutra: operadores/unidades SIN color asignado (o sistema/null). No rompe nada. */
export const NEUTRAL: Paleta = {
  key: '',
  label: 'Sin color',
  swatch: 'bg-gray-300',
  border: 'border-l-gray-300',
  text: 'text-gray-600',
  icon: 'text-gray-400',
  badge: 'bg-gray-100 text-gray-600',
  avatar: 'bg-gray-100 text-gray-500',
};

/** Paleta fija seleccionable. El ORDEN es el que se muestra en el picker. */
export const PALETAS: Paleta[] = [
  { key: 'verde',    label: 'Verde',    swatch: 'bg-green-500',  border: 'border-l-green-500',  text: 'text-green-700',  icon: 'text-green-500',  badge: 'bg-green-100 text-green-700',   avatar: 'bg-green-100 text-green-600' },
  { key: 'azul',     label: 'Azul',     swatch: 'bg-blue-500',   border: 'border-l-blue-500',   text: 'text-blue-700',   icon: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700',     avatar: 'bg-blue-100 text-blue-600' },
  { key: 'negro',    label: 'Negro',    swatch: 'bg-gray-900',   border: 'border-l-gray-900',   text: 'text-gray-900',   icon: 'text-gray-900',   badge: 'bg-gray-200 text-gray-900',     avatar: 'bg-gray-900 text-white' },
  { key: 'rojo',     label: 'Rojo',     swatch: 'bg-red-500',    border: 'border-l-red-500',    text: 'text-red-700',    icon: 'text-red-500',    badge: 'bg-red-100 text-red-700',       avatar: 'bg-red-100 text-red-600' },
  { key: 'naranja',  label: 'Naranja',  swatch: 'bg-orange-500', border: 'border-l-orange-500', text: 'text-orange-700', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700', avatar: 'bg-orange-100 text-orange-600' },
  { key: 'violeta',  label: 'Violeta',  swatch: 'bg-purple-500', border: 'border-l-purple-500', text: 'text-purple-700', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700', avatar: 'bg-purple-100 text-purple-600' },
  { key: 'celeste',  label: 'Celeste',  swatch: 'bg-sky-500',    border: 'border-l-sky-500',    text: 'text-sky-700',    icon: 'text-sky-500',    badge: 'bg-sky-100 text-sky-700',       avatar: 'bg-sky-100 text-sky-600' },
  { key: 'amarillo', label: 'Amarillo', swatch: 'bg-amber-500',  border: 'border-l-amber-500',  text: 'text-amber-700',  icon: 'text-amber-500',  badge: 'bg-amber-100 text-amber-800',   avatar: 'bg-amber-100 text-amber-600' },
  { key: 'rosa',     label: 'Rosa',     swatch: 'bg-pink-500',   border: 'border-l-pink-500',   text: 'text-pink-700',   icon: 'text-pink-500',   badge: 'bg-pink-100 text-pink-700',     avatar: 'bg-pink-100 text-pink-600' },
  { key: 'turquesa', label: 'Turquesa', swatch: 'bg-teal-500',   border: 'border-l-teal-500',   text: 'text-teal-700',   icon: 'text-teal-500',   badge: 'bg-teal-100 text-teal-700',     avatar: 'bg-teal-100 text-teal-600' },
  { key: 'indigo',   label: 'Índigo',   swatch: 'bg-indigo-500', border: 'border-l-indigo-500', text: 'text-indigo-700', icon: 'text-indigo-500', badge: 'bg-indigo-100 text-indigo-700', avatar: 'bg-indigo-100 text-indigo-600' },
  { key: 'gris',     label: 'Gris',     swatch: 'bg-slate-500',  border: 'border-l-slate-500',  text: 'text-slate-700',  icon: 'text-slate-500',  badge: 'bg-slate-100 text-slate-700',   avatar: 'bg-slate-100 text-slate-600' },
];

const PALETA_POR_KEY = new Map(PALETAS.map((p) => [p.key, p]));

/** Devuelve la paleta de una key guardada en DB. Sin key conocida → gris neutro. */
export const getPaleta = (key?: string | null): Paleta =>
  (key && PALETA_POR_KEY.get(key)) || NEUTRAL;

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
 * Paleta de un OPERADOR (Charlie). Prioriza el `color` guardado en DB; si no lo tiene,
 * cae al mapeo legado por nombre; si nada matchea (admin, superadmin, sistema) → gris.
 */
export const colorOperador = (
  operador?: { color?: string | null; nombre?: string | null } | null,
): Paleta => {
  if (!operador) return NEUTRAL;
  if (operador.color) return getPaleta(operador.color);
  const n = normalizar(operador.nombre);
  for (const key of Object.keys(LEGADO_POR_NOMBRE)) {
    if (n === key || n.split(/\s+/).includes(key)) return getPaleta(LEGADO_POR_NOMBRE[key]);
  }
  return NEUTRAL;
};

/** Paleta de una UNIDAD según su color de identidad (key de paleta en DB). */
export const colorUnidad = (
  unidad?: { colorIdentidad?: string | null } | null,
): Paleta => getPaleta(unidad?.colorIdentidad);
