import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import * as express from 'express';

const server = express();

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Admission Recommendation Platform API')
    .setDescription('APIs for university search, recommendation engine, and dynamic score calculation')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.init();
};

// Start bootstrapping NestJS
bootstrap();

// Export the express server instance for Vercel
export default server;
