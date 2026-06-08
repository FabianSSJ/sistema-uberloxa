import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de la API
  app.setGlobalPrefix('api');
  
  // Habilitar CORS para que el frontend pueda hacer peticiones
  app.enableCors();

  // Validación global de DTOs (enterprise: whitelist bloquea campos extra, transform convierte tipos)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true,  // lanza error si vienen propiedades extra
      transform: true,             // convierte payloads al tipo del DTO automáticamente
    }),
  );

  // Swagger — documentación automática en /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema Uberloxa API')
    .setDescription('API de gestión y despacho de carreras para central de taxis')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API corriendo en: http://localhost:${process.env.PORT ?? 3000}/api`);
  console.log(`📄 Swagger docs en:  http://localhost:${process.env.PORT ?? 3000}/docs`);
}
bootstrap();
