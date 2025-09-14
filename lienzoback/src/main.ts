import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { corsConfig } from './config/cors.config';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌐 Configurar prefijo global (removido para compatibilidad con frontend)
  // app.setGlobalPrefix('api');

  // Configuración de CORS
  const isProduction = process.env.NODE_ENV === 'production';
  const config = isProduction ? corsConfig.production : corsConfig.development;
  app.enableCors(config);

  // 📄 Swagger
  const swaggerDoc = new DocumentBuilder()
    .setTitle('Lienzo Culinario')
    .setVersion('1.0')
    .setDescription(
      "API Design for Lienzo Culinario - Final Project Henry's Fullstack Developer Program.",
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup('docs', app, document);

  // 🛡️ IMPORTANTE: Configurar middleware específico para Stripe webhook
  // Usar express.raw() para preservar el raw body
  app.use('/payments/webhook', express.raw({ type: 'application/json' }));

  app.useGlobalPipes(new ValidationPipe());

  // Configuración general de body-parser para otras rutas
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Servidor iniciado en puerto ${process.env.PORT ?? 3001}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
