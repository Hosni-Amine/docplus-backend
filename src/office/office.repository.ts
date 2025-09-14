import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
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
