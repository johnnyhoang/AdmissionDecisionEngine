import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../dist/app.module';
import express from 'express';

const server = express();
let isInitialized = false;
let bootstrapError: any = null;

export const bootstrap = async () => {
  try {
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
    isInitialized = true;
  } catch (e: any) {
    bootstrapError = {
      message: e.message,
      stack: e.stack,
      name: e.name,
    };
    throw e;
  }
};

// Export the handler for Vercel
export default async (req: any, res: any) => {
  if (bootstrapError) {
    res.status(500).json({ error: 'Bootstrap failed previously', details: bootstrapError });
    return;
  }

  if (!isInitialized) {
    try {
      await bootstrap();
    } catch (e: any) {
      res.status(500).json({ 
        error: 'Bootstrap failed during request', 
        details: {
          message: e.message,
          stack: e.stack,
          name: e.name,
        }
      });
      return;
    }
  }
  return server(req, res);
};
