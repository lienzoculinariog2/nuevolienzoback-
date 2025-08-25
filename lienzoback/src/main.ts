import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { corsConfig } from './config/cors.config';

async function bootstrap() {
  console.log('🚀 Iniciando aplicación...');
  const app = await NestFactory.create(AppModule);
  console.log('✅ Aplicación creada exitosamente');
  
  // 🌐 Configurar prefijo global (removido para compatibilidad con frontend)
  // app.setGlobalPrefix('api');
  
  // Configuración de CORS
  const isProduction = process.env.NODE_ENV === 'production';
  const config = isProduction ? corsConfig.production : corsConfig.development;
  app.enableCors(config);

  console.log('🔧 CORS Configuration:');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Frontend URL:', process.env.FRONTEND_URL || 'Not configured');
  console.log('CORS Origins:', config.origin);

  // 📄 Swagger
  const swaggerDoc = new DocumentBuilder()
    .setTitle('Lienzo Culinario')
    .setVersion('1.0')
    .setDescription(
      "API Design for the Lienzo Culinario Final Project (Henry's Fullstack Developer Program).",
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup('docs', app, document);

  // 🛡️ IMPORTANTE: Configurar body-parser para Stripe webhook ANTES de la configuración general
  // Esto es necesario para que Stripe pueda verificar la firma del webhook
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  app.useGlobalPipes(new ValidationPipe());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));


  console.log('🌐 Configurando servidor...');
  await app.listen(process.env.PORT ?? 3001);
  console.log(`✅ Servidor iniciado en puerto ${process.env.PORT ?? 3001}`);
  console.log('🎯 Aplicación lista para recibir peticiones');
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
