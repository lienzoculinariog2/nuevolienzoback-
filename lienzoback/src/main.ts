import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { corsConfig } from './config/cors.config';

async function bootstrap() {
  // Preserve the exact request bytes required for Stripe signature verification.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Use Nest's parsers so rawBody remains available for Stripe signature verification.
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

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

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Servidor iniciado en puerto ${process.env.PORT ?? 3001}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
