import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.setGlobalPrefix('/api', {
    exclude: [
      { path: 'uploads', method: RequestMethod.ALL },
      { path: 'uploads/(.*)', method: RequestMethod.ALL },
    ],
  });

  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const corsOrigin = isDevelopment
    ? true
    : configService.get<string>('CORS_ORIGIN')?.trim() || false;

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const port = configService.get('PORT') || 4000;
  await app.listen(port, '0.0.0.0');

  console.log(
    `Server running ${process.env.NODE_ENV === 'development' ? 'on port ' + port : 'on production'}`,
  );
}
bootstrap();
