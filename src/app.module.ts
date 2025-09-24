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
import { OfficeModule } from './office/office.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    OfficeModule,
    MailingModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRY'),
        },
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
  ],
  exports: [AppModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
