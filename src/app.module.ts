import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { MailingModule } from './mailing/mailing.module';
import { UploadModule } from './upload/upload.module';
import { GuardsModule } from './guards/guards.module';
import { JwtSignOptions } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    GuardsModule,
    AuthModule,
    UserModule,
    MailingModule,
    UploadModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'JWT_EXPIRY',
          ) as JwtSignOptions['expiresIn'],
          algorithm: 'HS256' as const,
        },
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),
  ],
  exports: [AppModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
