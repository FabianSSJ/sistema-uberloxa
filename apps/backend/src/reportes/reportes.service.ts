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
  porUnidad: Array<{ numeroUnidad: string | null; choferNombre: string | null; cantidad: number }>;
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
      this.prisma.$queryRaw<Array<{ numeroUnidad: string | null; choferNombre: string | null; cantidad: number }>>`
        SELECT u.numero_unidad AS "numeroUnidad", u.chofer_nombre AS "choferNombre", COUNT(c.id)::int AS cantidad
        FROM carreras c JOIN unidades u ON u.id = c.unidad_id WHERE ${condicionFecha}
        GROUP BY u.id, u.numero_unidad, u.chofer_nombre ORDER BY cantidad DESC
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
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pad = (n: number) => String(n).padStart(2, '0');
      const esRango = d.fecha.includes(' al ');

      // Encabezado principal (Página 1)
      doc.fillColor('#16a34a').fontSize(22).font('Helvetica-Bold').text('Sistema UberLoxa', { continued: false });
      doc.moveDown(0.2);
      doc.fillColor('#111827').fontSize(14).text(esRango ? 'Informe de carreras por período' : 'Informe diario de carreras');
      doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text(`${esRango ? 'Período' : 'Fecha'}: ${d.fecha}`);
      doc.moveTo(40, doc.y + 6).lineTo(555, doc.y + 6).strokeColor('#e5e7eb').stroke();
      doc.moveDown(1.2);

      // Resumen
      doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('Resumen del día');
      doc.moveDown(0.4);
      const linea = (label: string, valor: string | number, color = '#111827') => {
        doc.font('Helvetica').fontSize(10).fillColor('#374151').text(label, { continued: true });
        doc.font('Helvetica-Bold').fillColor(color).text(`   ${valor}`);
      };
      linea('Carreras totales:', d.total);
      linea('Completadas:', d.completadas, '#16a34a');
      linea('Canceladas:', d.canceladas, '#dc2626');
      linea('Perdidas:', d.perdidas, '#ea580c');
      if (d.enCurso) linea('En curso:', d.enCurso, '#2563eb');
      doc.moveDown(0.4);
      if (d.horaPico) {
        doc.font('Helvetica').fontSize(10).fillColor('#374151').text('Hora pico:', { continued: true });
        doc.font('Helvetica-Bold').fillColor('#16a34a').text(`   entre las ${pad(d.horaPico.hora)}:00 y las ${pad((d.horaPico.hora + 1) % 24)}:00  (${d.horaPico.cantidad} carreras)`);
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('Hora pico: sin datos');
      }

      doc.moveDown(1.2);

      // Carreras por unidad (más a menos)
      doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('Carreras por unidad (de más a menos)');
      doc.moveDown(0.5);

      if (d.porUnidad.length === 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(`No hubo carreras asignadas a unidades ${esRango ? `en el período ${d.fecha}` : `el ${d.fecha}`}.`);
      } else {
        // 2 columnas (en vez de la única columna a todo el ancho de antes): entran más
        // unidades por página sin tener que sacrificar la columna de chofer/conductor
        // (issue detectado en code review: la versión de 3 columnas la dejaba afuera).
        const NUM_COLS = 2;
        const COL_WIDTH = 245;
        const COL_GAP = 25;
        const MARGIN_LEFT = 40;
        const ROW_HEIGHT = 16;
        const HEADER_HEIGHT = 20;
        const MAX_PAGE_Y = 750;

        // Única fuente de verdad para la posición/ancho de cada columna: la cabecera y las
        // filas de datos leen de acá en vez de repetir los offsets cada una por su lado —
        // así "columna en la cabecera pero no en los datos" (como pasó con CHOFER la primera
        // vez que se armó este layout) deja de ser posible.
        type ItemUnidad = (typeof d.porUnidad)[number];
        const COLUMNS: Array<{
          x: number; width: number; header: string; align?: 'left' | 'right';
          font: string; size: number; color: string; ellipsis?: boolean; textHeight?: number;
          value: (u: ItemUnidad, globalIndex: number) => string;
        }> = [
          { x: 0, width: 20, header: '#', font: 'Helvetica', size: 8.5, color: '#6b7280', value: (_u, i) => String(i) },
          { x: 22, width: 50, header: 'UNIDAD', font: 'Helvetica-Bold', size: 8.5, color: '#111827', value: (u) => `Nº ${u.numeroUnidad || 'S/N'}` },
          // height fijo es imprescindible: sin él, pdfkit ignora "ellipsis" en nombres largos
          // y envuelve a una segunda línea que se superpone con la fila de abajo.
          { x: 74, width: 110, header: 'CHOFER / CONDUCTOR', font: 'Helvetica', size: 8, color: '#374151', ellipsis: true, textHeight: 10, value: (u) => u.choferNombre?.trim() || 'Sin chofer asignado' },
          { x: 186, width: 59, header: 'CARRERAS', align: 'right', font: 'Helvetica-Bold', size: 8.5, color: '#16a34a', value: (u) => String(u.cantidad) },
        ];

        let yCurr = doc.y;
        let startIndex = 0;
        const items = d.porUnidad;

        // Si el bloque de resumen de arriba dejó muy poco lugar en la página actual
        // (menos de lo que ocupan cabecera + una fila), saltamos de página ANTES de
        // empezar a dibujar en vez de forzar una fila cerca del pie de página.
        if (MAX_PAGE_Y - (yCurr + HEADER_HEIGHT) < ROW_HEIGHT) {
          doc.addPage();
          yCurr = 40;
        }

        while (startIndex < items.length) {
          const availableHeight = MAX_PAGE_Y - (yCurr + HEADER_HEIGHT);
          const maxRowsPerPage = Math.max(1, Math.floor(availableHeight / ROW_HEIGHT));
          const itemsPerPage = maxRowsPerPage * NUM_COLS;

          const pageItems = items.slice(startIndex, startIndex + itemsPerPage);
          const rowsThisPage = Math.min(maxRowsPerPage, Math.max(1, Math.ceil(pageItems.length / NUM_COLS)));
          const numActiveCols = Math.min(NUM_COLS, Math.ceil(pageItems.length / rowsThisPage));

          // Dibujar cabeceras para cada columna activa en esta página
          for (let col = 0; col < numActiveCols; col++) {
            const colX = MARGIN_LEFT + col * (COL_WIDTH + COL_GAP);
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#6b7280');
            for (const c of COLUMNS) {
              doc.text(c.header, colX + c.x, yCurr, { width: c.width, align: c.align });
            }
            doc.moveTo(colX, yCurr + 13).lineTo(colX + COL_WIDTH, yCurr + 13).strokeColor('#d1d5db').lineWidth(0.8).stroke();
          }

          // Renderizar los elementos verticalmente por columna
          pageItems.forEach((u, i) => {
            const col = Math.floor(i / rowsThisPage);
            const row = i % rowsThisPage;
            const colX = MARGIN_LEFT + col * (COL_WIDTH + COL_GAP);
            const itemY = yCurr + HEADER_HEIGHT + row * ROW_HEIGHT;
            const globalIndex = startIndex + i + 1;

            // Fondo alternado por fila dentro de cada columna
            if (row % 2 === 1) {
              doc.rect(colX - 2, itemY - 2, COL_WIDTH + 4, ROW_HEIGHT).fill('#f9fafb');
            }

            for (const c of COLUMNS) {
              doc.font(c.font).fontSize(c.size).fillColor(c.color);
              doc.text(c.value(u, globalIndex), colX + c.x, itemY, { width: c.width, align: c.align, ellipsis: c.ellipsis, height: c.textHeight });
            }
          });

          yCurr += HEADER_HEIGHT + rowsThisPage * ROW_HEIGHT + 10;
          startIndex += itemsPerPage;

          if (startIndex < items.length) {
            doc.addPage();
            yCurr = 40;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#6b7280').text(`Informe diario de carreras (${d.fecha}) - Continuación`, 40, yCurr);
            yCurr += 16;
          }
        }

        doc.y = yCurr;
      }

      // Numeración de páginas en el pie de página
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(8).fillColor('#9ca3af').text(
          `Informe generado automáticamente por Sistema UberLoxa. · Página ${i + 1} de ${pageRange.count}`,
          40,
          790,
          { align: 'center', width: 515, lineBreak: false }
        );
      }

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
