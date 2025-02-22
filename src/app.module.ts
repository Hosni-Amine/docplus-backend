import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '@src/user/user.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from '@app/common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { MailingModule } from './mailing/mailing.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    MailingModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env'
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRY,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
  ],
  exports: [AppModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
