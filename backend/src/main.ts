import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { EmptyStringNormalizerPipe } from './common/pipes/empty-string-normalizer.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) mkdirSync(uploadsPath, { recursive: true });
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors(
    corsOrigin?.length
      ? { origin: corsOrigin, credentials: true }
      : undefined,
  );

  app.useGlobalPipes(
    new EmptyStringNormalizerPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Club Deportivo API')
    .setDescription(`
      API para la gestión de clubes deportivos.
      
      ## Funcionalidades:
      - Autenticación de usuarios (JWT)
      - Gestión de sucursales, categorías, turnos
      - Registro de estudiantes y apoderados
      - Pagos con generación de QR
      - Control de asistencias
      - Eventos y campeonatos
      - Ventas de uniformes
      - Chat en tiempo real
      - Reportes en Excel/PDF
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación')
    .addTag('users', 'Usuarios')
    .addTag('branches', 'Sucursales')
    .addTag('categories', 'Categorías')
    .addTag('shifts', 'Turnos')
    .addTag('students', 'Estudiantes')
    .addTag('guardians', 'Apoderados')
    .addTag('payments', 'Pagos')
    .addTag('attendances', 'Asistencias')
    .addTag('events', 'Eventos')
    .addTag('products', 'Productos')
    .addTag('orders', 'Órdenes')
    .addTag('reports', 'Reportes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();