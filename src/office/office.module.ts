import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { OfficeController } from './office.controller';
import { OfficeRepository } from './office.repository';
import { OfficeService } from './office.service';
import { Office, OfficeSchema } from './entities/office.entity';
import { Contract, ContractSchema } from './entities/contract.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { OfficeContractRepository } from './office-contract.repository';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Office.name, schema: OfficeSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OfficeController],
  providers: [OfficeService, OfficeRepository, OfficeContractRepository],
  exports: [OfficeRepository],
})
export class OfficeModule {}
