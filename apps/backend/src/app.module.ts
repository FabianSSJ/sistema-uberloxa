import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SectoresModule } from './sectores/sectores.module';
import { ClientesModule } from './clientes/clientes.module';
import { MarcasModule } from './marcas/marcas.module';
import { ModelosModule } from './modelos/modelos.module';
import { UnidadesModule } from './unidades/unidades.module';
import { CarrerasModule } from './carreras/carreras.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { ReportesModule } from './reportes/reportes.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,   // disponible en toda la app sin re-importar
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    // Rate limit GLOBAL, aplicado a TODA la API vía el APP_GUARD de abajo — antes solo
    // /auth/login estaba protegido, el resto de los ~40 endpoints no tenía ningún freno.
    //
    // Dato confirmado por el cliente: la mayoría del tráfico sale de UNA sola IP (todas las
    // Charlies en la misma oficina/wifi), no siempre pero sí la norma — así que ese balde
    // compartido es tráfico real de todos los días, no un peor-caso hipotético. Prioridad
    // explícita: CERO falsos positivos contra uso legítimo (una caída = plata perdida) sin
    // dejar de frenar un flood de verdad.
    //
    // El freno real y afinado vive en nginx (rate=40r/s + burst=200 SIN nodelay — el
    // excedente se ENCOLA con demora en vez de rechazarse, probado con `ab`: 500 req a
    // concurrencia 100 pasan con 0 fallos; un flood genuino de ~480 req/s sí se corta). Este
    // límite de acá es el backstop de la app — tiene que quedar SIEMPRE por encima del techo
    // sostenido de nginx (40 req/s = 2400/min) para que nginx sea el único que realmente
    // decide, y la app nunca se adelante a rechazar algo que nginx ya dejó pasar.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 3000 }]),
    PrismaModule,
    AuthModule,
    SectoresModule,
    ClientesModule,
    MarcasModule,
    ModelosModule,
    UnidadesModule,
    CarrerasModule,
    UsuariosModule,
    EstadisticasModule,
    ReportesModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
