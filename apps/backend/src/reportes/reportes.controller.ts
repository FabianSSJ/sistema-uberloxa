import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN')
export class ReportesController {
  constructor(
    private readonly reportes: ReportesService,
    private readonly whatsapp: WhatsappService,
  ) {}

  /** Estado de la conexión de WhatsApp (para saber si ya se escaneó el QR). */
  @Get('whatsapp/estado')
  estado() {
    return { conectado: this.whatsapp.estaConectado() };
  }

  /**
   * PDF de un día puntual ('YYYY-MM-DD', hora de Ecuador), de un rango [fecha, hasta] si se
   * pasan ambos, o filtrado por horario (hora puntual o franja hh:mm a hh:mm).
   */
  @Get('pdf')
  async pdf(
    @Res() res: Response,
    @Query('fecha') fecha?: string,
    @Query('hasta') hasta?: string,
    @Query('hora') hora?: string,
    @Query('horaInicio') horaInicio?: string,
    @Query('horaFin') horaFin?: string,
  ) {
    let hInicio = horaInicio;
    let hFin = horaFin;

    if (!hInicio && hora) {
      if (hora.includes('-')) {
        const partes = hora.split('-');
        hInicio = partes[0];
        hFin = partes[1];
      } else if (!isNaN(Number(hora)) && Number(hora) >= 0 && Number(hora) <= 23) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const num = parseInt(hora, 10);
        hInicio = `${pad(num)}:00`;
        hFin = `${pad((num + 1) % 24)}:00`;
      }
    }

    const datos = await this.reportes.datosDelPeriodo(fecha, hasta, hInicio, hFin);
    const pdf = await this.reportes.generarPDF(datos);
    const sufijoHora = hInicio && hFin ? `_${hInicio.replace(':', '')}_a_${hFin.replace(':', '')}` : '';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="informe-${datos.fecha.replace(/[\/\s]+/g, '-')}${sufijoHora}.pdf"`,
    });
    res.send(pdf);
  }

  /** Dispara el envío del informe del día AHORA (para probar el flujo completo). */
  @Post('enviar')
  enviarAhora() {
    return this.reportes.enviarReporteDiario();
  }
}
