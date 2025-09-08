import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

let cachedApp: any;

async function createNestApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/api', {
    exclude: [{ path: '*', method: RequestMethod.ALL }],
  });

  // Updated CORS configuration
  app.enableCors({
    origin: ['*'],
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

  await app.init();
  cachedApp = app;
  return app;
}

// For Vercel
export default async function handler(req: any, res: any) {
  const app = await createNestApp();
  return app.getHttpAdapter().getInstance()(req, res);
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  async function bootstrap() {
    const configService = new ConfigService();
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('/api', {
      exclude: [{ path: '*', method: RequestMethod.ALL }],
    });

    app.enableCors({
      origin: ['*'],
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

    console.log(`
🚀 Server running on port ${port}
📝 Environment: ${process.env.NODE_ENV || 'development'}
`);
  }
  bootstrap();
}
