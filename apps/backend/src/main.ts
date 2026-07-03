import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend server is running on: http://localhost:${port}`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/swagger`);
}
bootstrap();

