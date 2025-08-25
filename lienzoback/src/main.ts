import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { corsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configuración de CORS basada en el entorno
  const isProduction = process.env.NODE_ENV === 'production';
  const config = isProduction ? corsConfig.production : corsConfig.development;

  app.enableCors(config);

  // Log de configuración de CORS para debugging
  console.log('🔧 CORS Configuration:');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Frontend URL:', process.env.FRONTEND_URL || 'Not configured');
  console.log('CORS Origins:', config.origin);
  const swaggerDoc = new DocumentBuilder()
    .setTitle('Lienzo Culinario')
    .setVersion('1.0')
    .setDescription(
      "API Design for the Lienzo Culinario Final Project (Henry's Fullstack Developer Program).",
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup('api', app, document);

  // 🛡️ IMPORTANTE: Configurar body-parser para Stripe webhook ANTES de la configuración general
  // Esto es necesario para que Stripe pueda verificar la firma del webhook
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));
  
  app.useGlobalPipes(new ValidationPipe());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  // 🔍 Endpoint de health para diagnóstico usando Express directamente
  app.use('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001
    });
  });

  // 🔍 Endpoint raíz para verificar que el servidor está funcionando
  app.use('/', (req, res) => {
    if (req.method === 'GET' && req.path === '/') {
      res.json({
        message: 'Lienzo Culinario API',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0'
      });
    } else {
      res.status(404).json({ message: 'Not Found' });
    }
  });

  await app.listen(process.env.PORT ?? 3001);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
