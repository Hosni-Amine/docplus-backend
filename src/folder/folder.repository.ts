import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { populateUserFields } from '../user/user.fields';
import { Folder } from './entities/folder.entity';

const folderUserPopulate = [
  { path: 'user', select: populateUserFields },
  { path: 'createdBy', select: populateUserFields },
  { path: 'lastUpdatedBy', select: populateUserFields },
];

@Injectable()
export class FolderRepository extends AbstractRepository<Folder> {
  protected readonly logger = new Logger(FolderRepository.name);

  constructor(
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectConnection() connection: Connection,
  ) {
    super(folderModel, connection);
  }

  findWithUser(filterQuery: FilterQuery<Folder>): Promise<Folder[]> {
    return this.folderModel
      .find(filterQuery)
      .populate(folderUserPopulate)
      .lean({ virtuals: true });
  }

  findOneWithUser(filterQuery: FilterQuery<Folder>): Promise<Folder | null> {
    return this.folderModel
      .findOne(filterQuery)
      .populate(folderUserPopulate)
      .lean({ virtuals: true });
  }
}
