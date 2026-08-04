import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      // Con varias Charlies polleando /carreras/panel y /unidades cada 1s + admins, el pool
      // default de pg (10) puede quedarse corto bajo carga sostenida real. 15 es margen
      // razonable sin sobre-provisionar contra el max_connections de Postgres. Configurable
      // por si hace falta ajustar en producción sin tocar código.
      max: configService.get<number>('DATABASE_POOL_SIZE', 15),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}