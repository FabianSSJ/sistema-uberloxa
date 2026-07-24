import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const TZ = 'America/Guayaquil';

/**
 * Analítica de carreras: TODO se calcula con agregaciones SQL (GROUP BY) en la DB,
 * nunca bajando las carreras al cliente. Escala con miles de registros.
 */
@Injectable()
export class EstadisticasService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen() {
    const [porEstado, porDia, porHora, perdidasPorHora, topClientes] = await Promise.all([
      // Conteo por estado (para totales + salud operativa)
      this.prisma.$queryRawUnsafe<Array<{ estado: string; cantidad: number }>>(
        `SELECT estado::text AS estado, COUNT(*)::int AS cantidad FROM carreras GROUP BY estado`,
      ),
      // Volumen por día (últimos 30 días) — día en HORA DE ECUADOR
      this.prisma.$queryRawUnsafe<Array<{ dia: string; cantidad: number }>>(
        `SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guayaquil'), 'YYYY-MM-DD') AS dia, COUNT(*)::int AS cantidad
         FROM carreras WHERE created_at >= now() - interval '30 days'
         GROUP BY 1 ORDER BY 1`,
      ),
      // Hora pico: distribución por hora del día — hora en HORA DE ECUADOR
      this.prisma.$queryRawUnsafe<Array<{ hora: number; cantidad: number }>>(
        `SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guayaquil')::int AS hora, COUNT(*)::int AS cantidad
         FROM carreras GROUP BY 1 ORDER BY 1`,
      ),
      // Salud: carreras perdidas por hora (dónde se pierde demanda) — hora en HORA DE ECUADOR
      this.prisma.$queryRawUnsafe<Array<{ hora: number; cantidad: number }>>(
        `SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guayaquil')::int AS hora, COUNT(*)::int AS cantidad
         FROM carreras WHERE estado = 'perdida' GROUP BY 1 ORDER BY 1`,
      ),
      // Top clientes por carreras
      this.prisma.$queryRawUnsafe<Array<{ clienteId: number; codigo: number | null; nombre: string; cantidad: number }>>(
        `SELECT cl.id AS "clienteId", cl.codigo, cl.nombre, COUNT(c.id)::int AS cantidad
         FROM carreras c JOIN clientes cl ON cl.id = c.cliente_id
         GROUP BY cl.id, cl.codigo, cl.nombre
         ORDER BY cantidad DESC LIMIT 10`,
      ),
    ]);

    const m: Record<string, number> = {};
    for (const r of porEstado) m[r.estado] = r.cantidad;
    const completadas = m['completada'] || 0;
    const canceladas = m['cancelada'] || 0;
    const perdidas = m['perdida'] || 0;
    const enCurso = (m['pendiente'] || 0) + (m['asignada'] || 0);
    const total = completadas + canceladas + perdidas + enCurso;

    // Hora pico (la hora con más carreras), si hay datos
    const horaPico = porHora.reduce(
      (max, r) => (r.cantidad > (max?.cantidad ?? -1) ? r : max),
      null as { hora: number; cantidad: number } | null,
    );

    return {
      totales: { total, completadas, canceladas, perdidas, enCurso },
      porDia,
      porHora,
      perdidasPorHora,
      horaPico,
      topClientes,
    };
  }

  /**
   * Carreras por unidad, TODAS (no solo un top). Dos modos, según qué se pase:
   *
   *  - Sin `desde`: modo "Total acumulado" (el histórico, de siempre) — desde la primera
   *    carrera de cada unidad ("día 0") hasta `hasta` (o hasta hoy si tampoco se pasa `hasta`).
   *  - Con `desde`: modo "ventana acotada" (Hoy / Día específico / Rango de fechas) — cuenta
   *    SOLO las carreras entre `desde` y `hasta` (o el mismo `desde` si no hay `hasta`), no
   *    acumula desde el día 0.
   *
   * `desde`/`hasta` son 'YYYY-MM-DD' en hora de Ecuador (el valor crudo de un <input
   * type="date">). El casteo a fecha se hace en SQL con AT TIME ZONE, igual que en
   * reportes.service.ts — comparar contra el `Date` de JS sin este ajuste corta el día casi
   * 19hs antes de lo esperado (medianoche UTC = 19:00 del día anterior en Guayaquil).
   * LEFT JOIN desde unidades: una unidad sin carreras en el período también aparece, cantidad 0.
   */
  async rankingUnidades(desde?: string, hasta?: string) {
    type Fila = { unidadId: number; numeroUnidad: string | null; choferNombre: string | null; cantidad: number };

    if (desde) {
      const h = hasta || desde;
      return this.prisma.$queryRaw<Fila[]>`
        SELECT u.id AS "unidadId", u.numero_unidad AS "numeroUnidad", u.chofer_nombre AS "choferNombre",
               COUNT(c.id)::int AS cantidad
        FROM unidades u
        LEFT JOIN carreras c ON c.unidad_id = u.id
          AND (c.created_at AT TIME ZONE 'UTC' AT TIME ZONE '${Prisma.raw(TZ)}')::date BETWEEN ${desde}::date AND ${h}::date
        GROUP BY u.id, u.numero_unidad, u.chofer_nombre
        ORDER BY cantidad DESC, u.numero_unidad ASC
      `;
    }

    if (hasta) {
      return this.prisma.$queryRaw<Fila[]>`
        SELECT u.id AS "unidadId", u.numero_unidad AS "numeroUnidad", u.chofer_nombre AS "choferNombre",
               COUNT(c.id)::int AS cantidad
        FROM unidades u
        LEFT JOIN carreras c ON c.unidad_id = u.id
          AND (c.created_at AT TIME ZONE 'UTC' AT TIME ZONE '${Prisma.raw(TZ)}')::date <= ${hasta}::date
        GROUP BY u.id, u.numero_unidad, u.chofer_nombre
        ORDER BY cantidad DESC, u.numero_unidad ASC
      `;
    }

    return this.prisma.$queryRaw<Fila[]>`
      SELECT u.id AS "unidadId", u.numero_unidad AS "numeroUnidad", u.chofer_nombre AS "choferNombre",
             COUNT(c.id)::int AS cantidad
      FROM unidades u
      LEFT JOIN carreras c ON c.unidad_id = u.id
      GROUP BY u.id, u.numero_unidad, u.chofer_nombre
      ORDER BY cantidad DESC, u.numero_unidad ASC
    `;
  }
}
