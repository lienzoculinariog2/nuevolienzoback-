import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { config as dontenvConfig } from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});

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

  app.useGlobalPipes(new ValidationPipe());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);
  console.log(`Server running on port ${PORT}`);

  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
  dontenvConfig({ path: envFile });
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
