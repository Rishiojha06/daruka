import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('apiPrefix', '/api/v1');
  const port = configService.get<number>('port', 4000);
  const corsOrigin = configService.get<string>('corsOrigin', 'http://localhost:5173');

  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`Weekend Ride API running on: http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
}

bootstrap();
