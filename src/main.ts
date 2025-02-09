import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const configService = new ConfigService();
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('/api', {
    exclude: [{ path: '*', method: RequestMethod.ALL }]
  });
  app.enableCors({
    origin: ["*"]
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  await app.listen(configService.getOrThrow('PORT'));
  console.log(`Server is running on port ${+process.env.PORT || 4000}`);
}
bootstrap();
