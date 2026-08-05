import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Si algo escapa del ciclo request/response (una promesa suelta, un error en un job de
// @Interval/@Cron), sin esto se pierde en silencio — no hay stack trace, no hay log,
// nadie se entera hasta que alguien nota que "algo dejó de andar" a las 2am.
const logger = new Logger('Process');
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', reason instanceof Error ? reason.stack : String(reason));
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err.stack);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // En producción Node corre detrás de nginx (mismo host, solo localhost) y NUNCA se expone
  // directo a internet (ufw solo abre 80/443, no el puerto de la app). Sin este trust proxy,
  // Express ignora X-Forwarded-For y ve TODO tráfico como 127.0.0.1 — el rate limit por IP
  // (login + el global) terminaría compartiendo un solo balde entre TODOS los usuarios reales
  // en vez de uno por cliente. El '1' es a propósito: confía solo en el primer hop (nginx),
  // no en cualquier proxy que alguien intente colar más arriba.
  app.set('trust proxy', 1);

  // Prefijo global de la API
  app.setGlobalPrefix('api');

  // Red de seguridad: ningún error (previsto o no) sale como 500 crudo con detalle interno.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Headers de seguridad HTTP básicos (X-Content-Type-Options, HSTS, etc.) + compresión gzip
  // de las respuestas — nada de esto estaba antes.
  app.use(helmet());
  app.use(compression());

  // Límite explícito de tamaño de body: los DTOs de acá son chicos (texto, ids, etc.), 1mb
  // es generoso de sobra y evita que alguien mande un payload gigante a propósito.
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  // Deploy real: cuando llega SIGTERM, Nest drena requests en vuelo y corre onModuleDestroy
  // (ej. PrismaService desconecta limpio) en vez de cortar todo de un hachazo.
  app.enableShutdownHooks();

  // CORS restringido al/los origen(es) del frontend real (FRONTEND_URL en .env, separado por
  // comas si hay más de uno — ej. prod + staging). Sin la variable, cae al dev server local.
  // Antes esto era `enableCors()` a secas = `Access-Control-Allow-Origin: *` para CUALQUIER
  // origen, lo cual no tiene sentido productivo aunque el auth sea Bearer (no cookie).
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  if (process.env.NODE_ENV === 'production' && !configService.get<string>('FRONTEND_URL')) {
    // Sin esto, en prod CORS cae en silencio al fallback de localhost y nada de afuera
    // puede llamar a la API — mejor un warning claro en el log que un misterio a debuggear.
    new Logger('Bootstrap').warn('FRONTEND_URL no está seteada en producción — CORS va a apuntar a localhost.');
  }
  app.enableCors({ origin: frontendUrl.split(',').map((o) => o.trim()) });

  // Validación global de DTOs (enterprise: whitelist bloquea campos extra, transform convierte tipos)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true,  // lanza error si vienen propiedades extra
      transform: true,             // convierte payloads al tipo del DTO automáticamente
    }),
  );

  // Swagger — documentación automática en /docs, SOLO fuera de producción: expone todos los
  // DTOs y rutas sin autenticación propia, no tiene sentido dejarlo público en el deploy real.
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sistema Uberloxa API')
      .setDescription('API de gestión y despacho de carreras para central de taxis')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    console.log(`📄 Swagger docs en:  http://localhost:${process.env.PORT ?? 3001}/docs`);
  }

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 API corriendo en: http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
