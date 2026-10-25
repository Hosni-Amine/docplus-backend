import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { Contract } from './entities/contract.entity';

@Injectable()
export class OfficeContractRepository extends AbstractRepository<Contract> {
  protected readonly logger = new Logger(OfficeContractRepository.name);

  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<Contract>,
    @InjectConnection() connection: Connection,
  ) {
    super(contractModel, connection);
  }

  findByOffice(officeId: string): Promise<Contract[]> {
    return this.contractModel.find({ officeId }).sort({ startDate: -1 }).lean();
  }
}
