import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OfficeController } from './office.controller';
import { OfficeService } from './office.service';
import { OfficeRepository } from './office.repository';
import { Office, OfficeSchema } from './entities/office.entity';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: Office.name, schema: OfficeSchema }]),
  ],
  controllers: [OfficeController],
  providers: [OfficeService, OfficeRepository],
  exports: [OfficeService, OfficeRepository],
})
export class OfficeModule {}
