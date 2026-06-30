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
  /** ring-2 ring-*-400 border-*-200: para destacar toda la tarjeta */
  ring: string;
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
  ring: 'ring-2 ring-gray-400 border-gray-200',
};

/** Paleta fija seleccionable. El ORDEN es el que se muestra en el picker. */
export const PALETAS: Paleta[] = [
  { key: 'verde',    label: 'Verde',    swatch: 'bg-green-500',  border: 'border-l-green-500',  text: 'text-green-700',  icon: 'text-green-500',  badge: 'bg-green-100 text-green-700',   avatar: 'bg-green-100 text-green-600', ring: 'ring-2 ring-green-400 border-green-200' },
  { key: 'azul',     label: 'Azul',     swatch: 'bg-blue-500',   border: 'border-l-blue-500',   text: 'text-blue-700',   icon: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700',     avatar: 'bg-blue-100 text-blue-600', ring: 'ring-2 ring-blue-400 border-blue-200' },
  { key: 'negro',    label: 'Negro',    swatch: 'bg-gray-900',   border: 'border-l-gray-900',   text: 'text-gray-900',   icon: 'text-gray-900',   badge: 'bg-gray-200 text-gray-900',     avatar: 'bg-gray-900 text-white', ring: 'ring-2 ring-gray-500 border-gray-300' },
  { key: 'rojo',     label: 'Rojo',     swatch: 'bg-red-500',    border: 'border-l-red-500',    text: 'text-red-700',    icon: 'text-red-500',    badge: 'bg-red-100 text-red-700',       avatar: 'bg-red-100 text-red-600', ring: 'ring-2 ring-red-400 border-red-200' },
  { key: 'naranja',  label: 'Naranja',  swatch: 'bg-orange-500', border: 'border-l-orange-500', text: 'text-orange-700', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700', avatar: 'bg-orange-100 text-orange-600', ring: 'ring-2 ring-orange-400 border-orange-200' },
  { key: 'violeta',  label: 'Violeta',  swatch: 'bg-purple-500', border: 'border-l-purple-500', text: 'text-purple-700', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700', avatar: 'bg-purple-100 text-purple-600', ring: 'ring-2 ring-purple-400 border-purple-200' },
  { key: 'celeste',  label: 'Celeste',  swatch: 'bg-sky-500',    border: 'border-l-sky-500',    text: 'text-sky-700',    icon: 'text-sky-500',    badge: 'bg-sky-100 text-sky-700',       avatar: 'bg-sky-100 text-sky-600', ring: 'ring-2 ring-sky-400 border-sky-200' },
  { key: 'amarillo', label: 'Amarillo', swatch: 'bg-amber-500',  border: 'border-l-amber-500',  text: 'text-amber-700',  icon: 'text-amber-500',  badge: 'bg-amber-100 text-amber-800',   avatar: 'bg-amber-100 text-amber-600', ring: 'ring-2 ring-amber-400 border-amber-200' },
  { key: 'rosa',     label: 'Rosa',     swatch: 'bg-pink-500',   border: 'border-l-pink-500',   text: 'text-pink-700',   icon: 'text-pink-500',   badge: 'bg-pink-100 text-pink-700',     avatar: 'bg-pink-100 text-pink-600', ring: 'ring-2 ring-pink-400 border-pink-200' },
  { key: 'turquesa', label: 'Turquesa', swatch: 'bg-teal-500',   border: 'border-l-teal-500',   text: 'text-teal-700',   icon: 'text-teal-500',   badge: 'bg-teal-100 text-teal-700',     avatar: 'bg-teal-100 text-teal-600', ring: 'ring-2 ring-teal-400 border-teal-200' },
  { key: 'indigo',   label: 'Índigo',   swatch: 'bg-indigo-500', border: 'border-l-indigo-500', text: 'text-indigo-700', icon: 'text-indigo-500', badge: 'bg-indigo-100 text-indigo-700', avatar: 'bg-indigo-100 text-indigo-600', ring: 'ring-2 ring-indigo-400 border-indigo-200' },
  { key: 'gris',     label: 'Gris',     swatch: 'bg-slate-500',  border: 'border-l-slate-500',  text: 'text-slate-700',  icon: 'text-slate-500',  badge: 'bg-slate-100 text-slate-700',   avatar: 'bg-slate-100 text-slate-600', ring: 'ring-2 ring-slate-400 border-slate-200' },
  
  // Nuevos colores agregados a petición
  { key: 'vino',     label: 'Concho de Vino', swatch: 'bg-rose-800', border: 'border-l-rose-800', text: 'text-rose-900', icon: 'text-rose-800', badge: 'bg-rose-100 text-rose-800', avatar: 'bg-rose-100 text-rose-700', ring: 'ring-2 ring-rose-400 border-rose-300' },
  { key: 'dorado',   label: 'Dorado',         swatch: 'bg-yellow-600', border: 'border-l-yellow-600', text: 'text-yellow-800', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800', avatar: 'bg-yellow-100 text-yellow-700', ring: 'ring-2 ring-yellow-400 border-yellow-200' },
  { key: 'plata',    label: 'Plata / Plomo',  swatch: 'bg-gray-400', border: 'border-l-gray-400', text: 'text-gray-600', icon: 'text-gray-400', badge: 'bg-gray-100 text-gray-600', avatar: 'bg-gray-100 text-gray-500', ring: 'ring-2 ring-gray-300 border-gray-200' },
  { key: 'esmeralda',label: 'Esmeralda',      swatch: 'bg-emerald-500', border: 'border-l-emerald-500', text: 'text-emerald-700', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700', avatar: 'bg-emerald-100 text-emerald-600', ring: 'ring-2 ring-emerald-400 border-emerald-200' },
  { key: 'lima',     label: 'Lima',           swatch: 'bg-lime-500', border: 'border-l-lime-500', text: 'text-lime-700', icon: 'text-lime-500', badge: 'bg-lime-100 text-lime-700', avatar: 'bg-lime-100 text-lime-600', ring: 'ring-2 ring-lime-400 border-lime-200' },
  { key: 'fucsia',   label: 'Fucsia',         swatch: 'bg-fuchsia-500', border: 'border-l-fuchsia-500', text: 'text-fuchsia-700', icon: 'text-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-700', avatar: 'bg-fuchsia-100 text-fuchsia-600', ring: 'ring-2 ring-fuchsia-400 border-fuchsia-200' },
  { key: 'marrón',   label: 'Marrón / Café',  swatch: 'bg-stone-600', border: 'border-l-stone-600', text: 'text-stone-800', icon: 'text-stone-600', badge: 'bg-stone-100 text-stone-700', avatar: 'bg-stone-100 text-stone-600', ring: 'ring-2 ring-stone-400 border-stone-300' },
  { key: 'blanco',   label: 'Blanco',         swatch: 'bg-white border border-gray-300', border: 'border-l-gray-300', text: 'text-gray-800', icon: 'text-gray-500', badge: 'bg-white border border-gray-200 text-gray-800', avatar: 'bg-gray-100 text-gray-800', ring: 'ring-2 ring-gray-200 border-gray-100' },
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
