import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { Prisma } from '../../generated/prisma/client';

// Número al que llega el informe diario (destinatario final).
const DESTINO = process.env.REPORTE_WHATSAPP || '593982232889';
const TZ = 'America/Guayaquil';

export interface ReporteDia {
  fecha: string;
  total: number;
  completadas: number;
  canceladas: number;
  perdidas: number;
  enCurso: number;
  horaPico: { hora: number; cantidad: number } | null;
  porUnidad: Array<{ numeroUnidad: string | null; cantidad: number }>;
}

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {}

  /**
   * Junta los datos de un día o rango de días (hora de Ecuador). `desde`/`hasta` son
   * 'YYYY-MM-DD' ya en hora de Ecuador (tal cual salen de un <input type="date">). Sin
   * ninguno de los dos, es "hoy"; con solo `desde`, es ese día puntual (como antes); con
   * ambos, es el rango completo [desde, hasta] inclusive. Usa $queryRaw (tagged template) en
   * vez de $queryRawUnsafe porque acá SÍ entran valores que vienen del usuario — Prisma los
   * bindea como parámetro, no los concatena, así que no hay riesgo de inyección SQL aunque
   * `desde`/`hasta` sean arbitrarios.
   */
  async datosDelPeriodo(desde?: string, hasta?: string): Promise<ReporteDia> {
    const d = desde || hasta;
    const h = hasta || desde;
    const condicionFecha = d
      ? Prisma.sql`(c.created_at AT TIME ZONE 'UTC' AT TIME ZONE '${Prisma.raw(TZ)}')::date BETWEEN ${d}::date AND ${h}::date`
      : Prisma.sql`(c.created_at AT TIME ZONE 'UTC' AT TIME ZONE '${Prisma.raw(TZ)}')::date = (now() AT TIME ZONE '${Prisma.raw(TZ)}')::date`;

    const [porEstado, porHora, porUnidad] = await Promise.all([
      this.prisma.$queryRaw<Array<{ estado: string; cantidad: number }>>`
        SELECT c.estado::text AS estado, COUNT(*)::int AS cantidad FROM carreras c WHERE ${condicionFecha} GROUP BY c.estado
      `,
      this.prisma.$queryRaw<Array<{ hora: number; cantidad: number }>>`
        SELECT EXTRACT(HOUR FROM c.created_at AT TIME ZONE 'UTC' AT TIME ZONE '${Prisma.raw(TZ)}')::int AS hora, COUNT(*)::int AS cantidad
        FROM carreras c WHERE ${condicionFecha} GROUP BY 1 ORDER BY 2 DESC
      `,
      this.prisma.$queryRaw<Array<{ numeroUnidad: string | null; cantidad: number }>>`
        SELECT u.numero_unidad AS "numeroUnidad", COUNT(c.id)::int AS cantidad
        FROM carreras c JOIN unidades u ON u.id = c.unidad_id WHERE ${condicionFecha}
        GROUP BY u.id, u.numero_unidad ORDER BY cantidad DESC
      `,
    ]);

    // 'YYYY-MM-DD' -> 'DD/MM/YYYY' en JS directo (sin viaje a la DB) cuando ya tenemos la(s)
    // fecha(s); si es "hoy" (sin desde ni hasta), sí hace falta preguntarle a la DB qué día es
    // hoy en hora de Ecuador. Con rango real (d !== h), el label queda "DD/MM/YYYY al DD/MM/YYYY".
    const aDDMMYYYY = (ymd: string) => ymd.split('-').reverse().join('/');
    const fechaFormateada = d
      ? (d === h ? aDDMMYYYY(d) : `${aDDMMYYYY(d)} al ${aDDMMYYYY(h!)}`)
      : (await this.prisma.$queryRaw<Array<{ fecha: string }>>`
          SELECT to_char(now() AT TIME ZONE '${Prisma.raw(TZ)}', 'DD/MM/YYYY') AS fecha
        `)[0]?.fecha || '';

    const m: Record<string, number> = {};
    for (const r of porEstado) m[r.estado] = r.cantidad;
    const completadas = m['completada'] || 0;
    const canceladas = m['cancelada'] || 0;
    const perdidas = m['perdida'] || 0;
    const enCurso = (m['pendiente'] || 0) + (m['asignada'] || 0);

    return {
      fecha: fechaFormateada,
      total: completadas + canceladas + perdidas + enCurso,
      completadas,
      canceladas,
      perdidas,
      enCurso,
      horaPico: porHora.length ? porHora[0] : null, // ya viene ordenado por cantidad desc
      porUnidad,
    };
  }

  /** Arma el PDF del informe y lo devuelve como Buffer. */
  generarPDF(d: ReporteDia): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pad = (n: number) => String(n).padStart(2, '0');
      const esRango = d.fecha.includes(' al ');

      // Encabezado
      doc.fillColor('#16a34a').fontSize(22).font('Helvetica-Bold').text('Sistema UberLoxa', { continued: false });
      doc.moveDown(0.2);
      doc.fillColor('#111827').fontSize(15).text(esRango ? 'Informe de carreras por período' : 'Informe diario de carreras');
      doc.fillColor('#6b7280').fontSize(11).font('Helvetica').text(`${esRango ? 'Período' : 'Fecha'}: ${d.fecha}`);
      doc.moveTo(45, doc.y + 6).lineTo(550, doc.y + 6).strokeColor('#e5e7eb').stroke();
      doc.moveDown(1.2);

      // Resumen
      doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Resumen del día');
      doc.moveDown(0.4);
      const linea = (label: string, valor: string | number, color = '#111827') => {
        doc.font('Helvetica').fontSize(11).fillColor('#374151').text(label, { continued: true });
        doc.font('Helvetica-Bold').fillColor(color).text(`   ${valor}`);
      };
      linea('Carreras totales:', d.total);
      linea('Completadas:', d.completadas, '#16a34a');
      linea('Canceladas:', d.canceladas, '#dc2626');
      linea('Perdidas:', d.perdidas, '#ea580c');
      if (d.enCurso) linea('En curso:', d.enCurso, '#2563eb');
      doc.moveDown(0.4);
      if (d.horaPico) {
        doc.font('Helvetica').fontSize(11).fillColor('#374151').text('Hora pico:', { continued: true });
        doc.font('Helvetica-Bold').fillColor('#16a34a').text(`   entre las ${pad(d.horaPico.hora)}:00 y las ${pad((d.horaPico.hora + 1) % 24)}:00  (${d.horaPico.cantidad} carreras)`);
      } else {
        doc.font('Helvetica').fontSize(11).fillColor('#6b7280').text('Hora pico: sin datos');
      }

      doc.moveDown(1.2);

      // Carreras por unidad (más a menos)
      doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Carreras por unidad (de más a menos)');
      doc.moveDown(0.5);

      if (d.porUnidad.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#6b7280').text(`No hubo carreras asignadas a unidades ${esRango ? `en el período ${d.fecha}` : `el ${d.fecha}`}.`);
      } else {
        // cabecera de tabla
        const y0 = doc.y;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#6b7280');
        doc.text('#', 45, y0, { width: 30 });
        doc.text('UNIDAD', 90, y0, { width: 200 });
        doc.text('CARRERAS', 470, y0, { width: 80, align: 'right' });
        doc.moveTo(45, doc.y + 3).lineTo(550, doc.y + 3).strokeColor('#e5e7eb').stroke();
        doc.moveDown(0.5);

        d.porUnidad.forEach((u, i) => {
          const y = doc.y;
          doc.font('Helvetica').fontSize(10).fillColor('#374151');
          doc.text(String(i + 1), 45, y, { width: 30 });
          doc.font('Helvetica-Bold').text(`Nº ${u.numeroUnidad || 'S/N'}`, 90, y, { width: 200 });
          doc.font('Helvetica-Bold').fillColor('#16a34a').text(String(u.cantidad), 470, y, { width: 80, align: 'right' });
          doc.moveDown(0.6);
        });
      }

      // Pie
      doc.moveDown(2);
      doc.font('Helvetica').fontSize(9).fillColor('#9ca3af').text('Informe generado automáticamente por Sistema UberLoxa.', { align: 'center' });

      doc.end();
    });
  }

  /** Genera y envía el informe del día por WhatsApp. Usado por el cron y el endpoint manual. */
  async enviarReporteDiario(): Promise<{ ok: boolean; detalle: string }> {
    const datos = await this.datosDelPeriodo();
    const pdf = await this.generarPDF(datos);
    const nombre = `Informe_UberLoxa_${datos.fecha.replace(/\//g, '-')}.pdf`;
    const caption = `📊 Informe diario UberLoxa — ${datos.fecha}\nTotal: ${datos.total} · Completadas: ${datos.completadas} · Canceladas: ${datos.canceladas} · Perdidas: ${datos.perdidas}`;

    const enviado = await this.whatsapp.enviarDocumento(DESTINO, pdf, nombre, caption);
    if (enviado) {
      this.logger.log(`Informe del ${datos.fecha} enviado a ${DESTINO}`);
      return { ok: true, detalle: `Enviado a ${DESTINO}` };
    }
    this.logger.warn(`Informe del ${datos.fecha} generado pero NO enviado (WhatsApp no conectado).`);
    return { ok: false, detalle: 'PDF generado, pero WhatsApp no está conectado (escaneá el QR).' };
  }

  // Todos los días a las 23:59:59, hora de Ecuador.
  @Cron('59 59 23 * * *', { timeZone: TZ })
  async tareaDiaria() {
    this.logger.log('Ejecutando envío programado del informe diario (23:59:59 Ecuador)...');
    try {
      await this.enviarReporteDiario();
    } catch (e) {
      this.logger.error('Error en el informe diario programado', e as any);
    }
  }
}
