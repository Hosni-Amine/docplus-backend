import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { Office } from './entities/office.entity';

const officeUsersPopulate = {
  path: 'officeUsers',
  select:
    'firstName lastName email role status avatarUrl phone address country state city zipCode',
};

@Injectable()
export class OfficeRepository extends AbstractRepository<Office> {
  protected readonly logger = new Logger(OfficeRepository.name);

  constructor(
    @InjectModel(Office.name) private readonly officeModel: Model<Office>,
    @InjectConnection() connection: Connection,
  ) {
    super(officeModel, connection);
  }

  findAllWithUsers(): Promise<Office[]> {
    return this.officeModel
      .find()
      .populate(officeUsersPopulate)
      .lean({ virtuals: true });
  }

  findOneWithUsers(id: string): Promise<Office | null> {
    return this.officeModel
      .findOne({ _id: id })
      .populate(officeUsersPopulate)
      .lean({ virtuals: true });
  }
}
