import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@src/user/schemas/user.schema';
import { UserRepository } from '@src/user/user.repository';
import { MailingService } from '@src/mailing/mailing.service';
import { DatabaseModule } from '@app/common/database/database.module';
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
