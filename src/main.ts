import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const configService = new ConfigService();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/api', {
    exclude: [{ path: '*', method: RequestMethod.ALL }],
  });

  app.enableCors({
    origin: ['http://localhost:5173', '/.vercel.app$/'],
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
