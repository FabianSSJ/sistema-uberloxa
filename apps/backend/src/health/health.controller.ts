import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sin guards a propósito: un orquestador/monitor (PM2, Docker, uptime checker) tiene que
 * poder pegarle sin token. No expone nada sensible, solo si el proceso y la DB responden.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down', timestamp: new Date().toISOString() });
    }
  }
}
