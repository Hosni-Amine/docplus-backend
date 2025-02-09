import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas';
import { UserRepository } from '../user/user.repository';
import { MailingService } from '@src/modules/mailing/mailing.service';
@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, MailingService],
  exports: [AuthModule]
})
export class AuthModule { }
