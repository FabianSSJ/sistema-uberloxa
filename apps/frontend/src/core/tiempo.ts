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

/** "03:15" (o "03:15:42" con segundos) */
export const hora = (valor: Date | string | number = new Date(), conSegundos = false): string =>
  d(valor).toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    ...(conSegundos ? { second: '2-digit' } : {}),
    timeZone: TZ_ECUADOR,
  });
