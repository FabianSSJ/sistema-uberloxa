/**
 * TIEMPO EN HORA DE ECUADOR: única fuente de verdad para mostrar fechas/horas.
 *
 * El sistema opera en Loja, Ecuador (America/Guayaquil, UTC-5, sin horario de verano).
 * Los timestamps se guardan en UTC (estándar); acá los CONVERTIMOS a hora de Ecuador al
 * mostrarlos, sin importar la zona horaria de la máquina del usuario. Así todo el sistema
 * habla la misma hora.
 */
export const TZ_ECUADOR = 'America/Guayaquil';

const d = (valor: Date | string | number): Date => (valor instanceof Date ? valor : new Date(valor));

/** "jueves, 2 de julio de 2026" */
export const fechaLarga = (valor: Date | string | number = new Date()): string =>
  d(valor).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ_ECUADOR,
  });

/** "02/07/2026" */
export const fechaCorta = (valor: Date | string | number = new Date()): string =>
  d(valor).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TZ_ECUADOR,
  });

/** ¿El timestamp cae HOY (día de Ecuador, 00:00–23:59)? */
export const esHoy = (valor: Date | string | number): boolean => fechaCorta(valor) === fechaCorta(new Date());

// Ecuador es UTC-5 fijo (sin horario de verano) — permite calcular límites de día
// local con aritmética simple, reutilizando fechaCorta (que ya resuelve el TZ).
const OFFSET_ECUADOR_MS = 5 * 60 * 60 * 1000;

/** Instante (UTC) de las 00:00 (medianoche) de esa fecha, en hora de Ecuador. */
export const inicioDiaEcuador = (valor: Date | string | number = new Date()): Date => {
  const [dd, mm, yyyy] = fechaCorta(valor).split('/').map(Number);
  return new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0) + OFFSET_ECUADOR_MS);
};

/** Instante (UTC) de las 00:00 del día SIGUIENTE, en hora de Ecuador (límite exclusivo). */
export const finDiaEcuador = (valor: Date | string | number = new Date()): Date =>
  new Date(inicioDiaEcuador(valor).getTime() + 24 * 60 * 60 * 1000);

/**
 * Igual que inicioDiaEcuador/finDiaEcuador, pero a partir de un string "YYYY-MM-DD" que YA
 * es la fecha de Ecuador elegida (el valor crudo de un <input type="date">). No hay que
 * convertir zona horaria acá — ese string no es un instante, es el día que el usuario tocó.
 */
export const inicioDiaEcuadorDesdeYMD = (ymd: string): Date => {
  const [yyyy, mm, dd] = ymd.split('-').map(Number);
  return new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0) + OFFSET_ECUADOR_MS);
};

export const finDiaEcuadorDesdeYMD = (ymd: string): Date =>
  new Date(inicioDiaEcuadorDesdeYMD(ymd).getTime() + 24 * 60 * 60 * 1000);

/** "03:15" (o "03:15:42" con segundos) */
export const hora = (valor: Date | string | number = new Date(), conSegundos = false): string =>
  d(valor).toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    ...(conSegundos ? { second: '2-digit' } : {}),
    timeZone: TZ_ECUADOR,
  });
