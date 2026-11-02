import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository extends AbstractRepository<User> {
  protected readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }

  async getDistinctSpecialties(
    filter: Record<string, unknown> = {},
  ): Promise<string[]> {
    const specialties = await this.userModel.distinct('specialty', filter);
    return (specialties || []).flat().filter(Boolean);
  }

  async findWithOfficePopulate(
    filter: Record<string, unknown>,
    options: {
      sort?: Record<string, 1 | -1>;
      userSelect?: string;
      officeSelect?: string;
    } = {},
  ): Promise<any[]> {
    const {
      sort = { lastName: 1, firstName: 1 },
      userSelect,
      officeSelect,
    } = options;

    let query = this.userModel
      .find(filter)
      .populate({
        path: 'officeId',
        select: officeSelect,
      })
      .sort(sort)
      .lean();

    if (userSelect) {
      query = query.select(userSelect) as any;
    }

    return await query;
  }
}
