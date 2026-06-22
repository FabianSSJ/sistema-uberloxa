/**
 * Búsqueda con RANKING por relevancia: UNA sola fuente de verdad para todo el sistema.
 *
 * No es un filtro sí/no — es un score. Cada entidad define sus campos buscables con un
 * PESO (qué tan fuerte es ese campo). El score de un registro = el MEJOR match que logró,
 * combinando el peso del campo con el tipo de coincidencia:
 *
 *   - igual exacto    → ×3
 *   - empieza con     → ×2   (prefijo: "lu" matchea "Lucrecia" fuerte)
 *   - contiene        → ×1   (en el medio: "lu" en "caluma" matchea débil)
 *
 * Así "lu" pone a Lucrecia (nombre prefijo: 50×2=100) muy por encima de un cliente cuya
 * dirección dice "caluma" (15×1=15). El ruido se hunde, lo relevante flota.
 *
 * IMPORTANTE: estos pesos están ESPEJADOS en el backend (clientes.service.ts → findPaginated,
 * ranking SQL). Si tocás un peso acá, actualizá el otro lado para mantener consistencia.
 */

// --- Definición de campos + pesos por entidad (única fuente de verdad) ---

interface FieldDef<T> {
  weight: number;
  get: (x: T) => unknown;
}

const CLIENTE_FIELDS: FieldDef<any>[] = [
  { weight: 100, get: (c) => c?.codigo },
  { weight: 50, get: (c) => c?.nombre },
  { weight: 40, get: (c) => c?.telefono },
  { weight: 40, get: (c) => c?.telefonoAlt },
  { weight: 20, get: (c) => c?.sector?.nombre },
  { weight: 15, get: (c) => c?.direccion },
  { weight: 10, get: (c) => c?.descripcion },
];

const UNIDAD_FIELDS: FieldDef<any>[] = [
  { weight: 50, get: (u) => u?.numeroUnidad },
  { weight: 50, get: (u) => u?.placa },
  { weight: 45, get: (u) => u?.choferNombre },
  { weight: 40, get: (u) => u?.choferTelefono },
  { weight: 20, get: (u) => u?.vehiculo },
  { weight: 15, get: (u) => u?.modelo?.nombre },
  { weight: 15, get: (u) => u?.modelo?.marca?.nombre },
  { weight: 10, get: (u) => u?.color },
  { weight: 10, get: (u) => u?.anio },
];

const CARRERA_FIELDS: FieldDef<any>[] = [
  { weight: 100, get: (r) => r?.id },
  { weight: 100, get: (r) => r?.numeroDiario },
  { weight: 60, get: (r) => r?.creadoPor?.nombre },
  { weight: 60, get: (r) => r?.creadoPor?.username },
];

const USUARIO_FIELDS: FieldDef<any>[] = [
  { weight: 50, get: (u) => u?.nombre },
  { weight: 40, get: (u) => u?.username },
  { weight: 30, get: (u) => u?.rol },
  { weight: 10, get: (u) => (Array.isArray(u?.modulosPermitidos) ? u.modulosPermitidos.join(' ') : '') },
];

const CHOFER_FIELDS: FieldDef<any>[] = [
  { weight: 50, get: (c) => c?.nombre },
  { weight: 40, get: (c) => c?.telefono },
];

// --- Núcleo del scoring ---

const norm = (v: unknown): string => (v == null ? '' : String(v).toLowerCase());

/** Multiplicador según el tipo de coincidencia: exacto ×3, prefijo ×2, contiene ×1, nada 0. */
const matchMultiplier = (value: unknown, query: string): number => {
  const v = norm(value);
  if (!v) return 0;
  if (v === query) return 3;
  if (v.startsWith(query)) return 2;
  if (v.includes(query)) return 1;
  return 0;
};

/** Score de un registro = el mejor (peso × multiplicador) entre todos sus campos. */
const scoreFields = <T>(item: T, query: string, fields: FieldDef<T>[]): number => {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let best = 0;
  for (const f of fields) {
    const s = f.weight * matchMultiplier(f.get(item), q);
    if (s > best) best = s;
  }
  return best;
};

/**
 * Ordena una lista por relevancia: puntúa, descarta lo que no matchea (score 0) y ordena
 * de mayor a menor. Sin query devuelve la lista tal cual (no filtra ni reordena).
 * El sort de JS es estable: ante mismo score, se respeta el orden original.
 */
export const rankBy = <T>(items: T[], query: string, scoreFn: (item: T, q: string) => number): T[] => {
  if (!query || !query.trim()) return items;
  return items
    .map((item) => ({ item, score: scoreFn(item, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
};

// --- Scorers por entidad (para buscadores de listas) ---

export const scoreCliente = (cliente: any, query: string): number => scoreFields(cliente, query, CLIENTE_FIELDS);
export const scoreUnidad = (unidad: any, query: string): number => scoreFields(unidad, query, UNIDAD_FIELDS);
export const scoreCarrera = (carrera: any, query: string): number => scoreFields(carrera, query, CARRERA_FIELDS);
export const scoreUsuario = (usuario: any, query: string): number => scoreFields(usuario, query, USUARIO_FIELDS);
export const scoreChofer = (chofer: any, query: string): number => scoreFields(chofer, query, CHOFER_FIELDS);

// --- searchText para opciones de <Select> (busca por todos los campos, no solo el label visible) ---

const toSearchText = <T>(item: T, fields: FieldDef<T>[]): string =>
  fields
    .map((f) => f.get(item))
    .filter((v) => v != null && v !== '')
    .join(' ');

export const clienteSearchText = (cliente: any): string => toSearchText(cliente, CLIENTE_FIELDS);
export const unidadSearchText = (unidad: any): string => toSearchText(unidad, UNIDAD_FIELDS);
