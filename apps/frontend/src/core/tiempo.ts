/**
 * TIEMPO EN HORA DE ECUADOR & JORNADA OPERATIVA: única fuente de verdad para fechas/horas.
 *
 * El sistema opera en Loja, Ecuador (America/Guayaquil, UTC-5, sin horario de verano).
 * La JORNADA OPERATIVA cubre desde las 04:00:00 AM hasta las 03:59:59 AM del día siguiente.
 * Cualquier carrera entre las 00:00 y las 03:59:59 AM pertenece a la jornada de ayer.
 *
 * Los timestamps se guardan en UTC en la DB y acá los convertimos con base en la jornada
 * operativa de Ecuador.
 */
export const TZ_ECUADOR = 'America/Guayaquil';
export const HORA_INICIO_JORNADA = 4; // 04:00 AM (corte diario a las 03:59:59 AM)

const OFFSET_ECUADOR_MS = 5 * 60 * 60 * 1000;
const OFFSET_CORTE_MS = HORA_INICIO_JORNADA * 60 * 60 * 1000;

const d = (valor: Date | string | number): Date => (valor instanceof Date ? valor : new Date(valor));

/** "jueves, 2 de julio de 2026" (fecha calendario real en Ecuador) */
export const fechaLarga = (valor: Date | string | number = new Date()): string =>
  d(valor).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ_ECUADOR,
  });

/** "02/07/2026" (fecha calendario real en Ecuador) */
export const fechaCorta = (valor: Date | string | number = new Date()): string =>
  d(valor).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TZ_ECUADOR,
  });

/**
 * Fecha 'YYYY-MM-DD' de la JORNADA OPERATIVA (04:00 a 03:59:59 Ecuador).
 * Ej: Sábado a las 02:30 AM devuelve la fecha del Viernes.
 */
export const diaOperativoYMD = (valor: Date | string | number = new Date()): string => {
  const localAjustado = new Date(d(valor).getTime() - OFFSET_ECUADOR_MS - OFFSET_CORTE_MS);
  const yyyy = localAjustado.getUTCFullYear();
  const mm = String(localAjustado.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(localAjustado.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** "02/07/2026" correspondiente a la jornada operativa */
export const fechaCortaOperativa = (valor: Date | string | number = new Date()): string =>
  diaOperativoYMD(valor).split('-').reverse().join('/');

/** ¿El timestamp cae en la JORNADA OPERATIVA ACTUAL (04:00 a 03:59:59)? */
export const esHoy = (valor: Date | string | number): boolean =>
  diaOperativoYMD(valor) === diaOperativoYMD(new Date());

/**
 * Instante (UTC) de las 04:00:00 AM (inicio de jornada) de esa fecha YMD en hora de Ecuador.
 */
export const inicioDiaEcuadorDesdeYMD = (ymd: string): Date => {
  const [yyyy, mm, dd] = ymd.split('-').map(Number);
  return new Date(Date.UTC(yyyy, mm - 1, dd, HORA_INICIO_JORNADA, 0, 0, 0) + OFFSET_ECUADOR_MS);
};

/**
 * Instante (UTC) de las 04:00:00 AM del día SIGUIENTE (cierre exclusivo de jornada).
 */
export const finDiaEcuadorDesdeYMD = (ymd: string): Date =>
  new Date(inicioDiaEcuadorDesdeYMD(ymd).getTime() + 24 * 60 * 60 * 1000);

/** "03:15" (o "03:15:42" con segundos) en hora de Ecuador */
export const hora = (valor: Date | string | number = new Date(), conSegundos = false): string =>
  d(valor).toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    ...(conSegundos ? { second: '2-digit' } : {}),
    timeZone: TZ_ECUADOR,
  });

