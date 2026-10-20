import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { OfficeController } from './office.controller';
import { OfficeRepository } from './office.repository';
import { OfficeService } from './office.service';
import { Office, OfficeSchema } from './entities/office.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Office.name, schema: OfficeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OfficeController],
  providers: [OfficeService, OfficeRepository],
  exports: [OfficeRepository],
})
export class OfficeModule {}
