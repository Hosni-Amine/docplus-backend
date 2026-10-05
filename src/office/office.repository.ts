import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { Office } from './entities/office.entity';

@Injectable()
export class OfficeRepository extends AbstractRepository<Office> {
  protected readonly logger = new Logger(OfficeRepository.name);

  constructor(
    @InjectModel(Office.name) officeModel: Model<Office>,
    @InjectConnection() connection: Connection,
  ) {
    super(officeModel, connection);
  }
}
