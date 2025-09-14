import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from './entities/user.entity';
import { DatabaseModule } from '@common/database/database.module';
import { UserRepository } from './user.repository';
import { Office, OfficeSchema } from '@src/office/entities/office.entity';
import { OfficeRepository } from '@src/office/office.repository';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Office.name, schema: OfficeSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, OfficeRepository],
})
export class UserModule {}
