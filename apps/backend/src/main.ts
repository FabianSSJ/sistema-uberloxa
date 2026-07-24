import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de la API
  app.setGlobalPrefix('api');

  // CORS restringido al/los origen(es) del frontend real (FRONTEND_URL en .env, separado por
  // comas si hay más de uno — ej. prod + staging). Sin la variable, cae al dev server local.
  // Antes esto era `enableCors()` a secas = `Access-Control-Allow-Origin: *` para CUALQUIER
  // origen, lo cual no tiene sentido productivo aunque el auth sea Bearer (no cookie).
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
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
