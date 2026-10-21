import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { publicUserFields } from '../user/user.fields';
import { Office } from './entities/office.entity';

const officeUsersPopulate = {
  path: 'officeUsers',
  select: publicUserFields,
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
