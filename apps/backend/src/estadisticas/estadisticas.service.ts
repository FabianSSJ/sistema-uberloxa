import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Analítica de carreras: TODO se calcula con agregaciones SQL (GROUP BY) en la DB,
 * nunca bajando las carreras al cliente. Escala con miles de registros.
 */
@Injectable()
export class EstadisticasService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen() {
    const [porEstado, porDia, porHora, perdidasPorHora, topUnidades, topClientes] = await Promise.all([
      // Conteo por estado (para totales + salud operativa)
      this.prisma.$queryRawUnsafe<Array<{ estado: string; cantidad: number }>>(
        `SELECT estado::text AS estado, COUNT(*)::int AS cantidad FROM carreras GROUP BY estado`,
      ),
      // Volumen por día (últimos 30 días)
      this.prisma.$queryRawUnsafe<Array<{ dia: string; cantidad: number }>>(
        `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS dia, COUNT(*)::int AS cantidad
         FROM carreras WHERE created_at >= now() - interval '30 days'
         GROUP BY 1 ORDER BY 1`,
      ),
      // Hora pico: distribución por hora del día
      this.prisma.$queryRawUnsafe<Array<{ hora: number; cantidad: number }>>(
        `SELECT EXTRACT(HOUR FROM created_at)::int AS hora, COUNT(*)::int AS cantidad
         FROM carreras GROUP BY 1 ORDER BY 1`,
      ),
      // Salud: carreras perdidas por hora (dónde se pierde demanda)
      this.prisma.$queryRawUnsafe<Array<{ hora: number; cantidad: number }>>(
        `SELECT EXTRACT(HOUR FROM created_at)::int AS hora, COUNT(*)::int AS cantidad
         FROM carreras WHERE estado = 'perdida' GROUP BY 1 ORDER BY 1`,
      ),
      // Ranking de unidades por carreras
      this.prisma.$queryRawUnsafe<Array<{ unidadId: number; numeroUnidad: string; choferNombre: string; cantidad: number }>>(
        `SELECT u.id AS "unidadId", u.numero_unidad AS "numeroUnidad", u.chofer_nombre AS "choferNombre", COUNT(c.id)::int AS cantidad
         FROM carreras c JOIN unidades u ON u.id = c.unidad_id
         GROUP BY u.id, u.numero_unidad, u.chofer_nombre
         ORDER BY cantidad DESC LIMIT 10`,
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
      topUnidades,
      topClientes,
    };
  }
}
