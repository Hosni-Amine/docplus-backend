import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const configService = new ConfigService();
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('/api', {
    exclude: [{ path: '*', method: RequestMethod.ALL }]
  });
  
  // Updated CORS configuration
  app.enableCors({
    origin: [configService.get('FRONTEND_URL_PROD'),configService.get('FRONTEND_URL')],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  
  const port = configService.get('PORT') || 4000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`
    🚀 Server running
    📝 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}
bootstrap();