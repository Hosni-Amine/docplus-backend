import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from './entities/user.entity';
import { DatabaseModule } from '../common/database/database.module';
import { UserRepository } from './user.repository';
import { OfficeModule } from '../office/office.module';

@Module({
  imports: [
    DatabaseModule,
    OfficeModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
