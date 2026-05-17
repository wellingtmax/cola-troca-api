import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import helmet from 'helmet';
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:4200',
    Credential: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(3000);

  console.log('API rodando em http://localhost:3000');
}

bootstrap();