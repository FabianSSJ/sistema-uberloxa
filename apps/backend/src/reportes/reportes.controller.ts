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
   * pasan ambos, o de hoy si no se pasa ninguno.
   */
  @Get('pdf')
  async pdf(@Res() res: Response, @Query('fecha') fecha?: string, @Query('hasta') hasta?: string) {
    const datos = await this.reportes.datosDelPeriodo(fecha, hasta);
    const pdf = await this.reportes.generarPDF(datos);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="informe-${datos.fecha.replace(/[\/\s]+/g, '-')}.pdf"`,
    });
    res.send(pdf);
  }

  /** Dispara el envío del informe del día AHORA (para probar el flujo completo). */
  @Post('enviar')
  enviarAhora() {
    return this.reportes.enviarReporteDiario();
  }
}
