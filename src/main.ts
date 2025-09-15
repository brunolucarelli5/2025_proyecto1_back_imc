import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Permite recibir peticiones desde el frontend, que se ejecuta en un puerto diferente
  app.enableCors({
    origin: process.env.FRONTEND_URL, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true 
  }));

  //Documentación de endpoints con Swagger → http://localhost:3000/docs
  const config = new DocumentBuilder()
    .setTitle('IMC App API')
    .setDescription('API para autenticación, usuarios y cálculo de IMC')
    .setVersion('1.0')
    .addBearerAuth() // Si usás JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();