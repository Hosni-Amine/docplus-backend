import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository, ERole } from '../common';
import { publicUserFields } from '../user/user.fields';
import { Office } from './entities/office.entity';

const officeAdminsPopulate = {
  path: 'officeAdmins',
  select: publicUserFields,
  match: { role: ERole.ADMIN },
};

const officeCountPopulate = ['adminsCount', 'usersCount'];

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
      .populate(officeAdminsPopulate)
      .populate(officeCountPopulate)
      .lean({ virtuals: true });
  }

  findOneWithUsers(id: string): Promise<Office | null> {
    return this.officeModel
      .findOne({ _id: id })
      .populate(officeAdminsPopulate)
      .populate(officeCountPopulate)
      .lean({ virtuals: true });
  }
}
