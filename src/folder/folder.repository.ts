import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { publicUserFields } from '../user/user.fields';
import { Folder } from './entities/folder.entity';

const folderUserPopulate = [
  { path: 'userId', select: publicUserFields },
  { path: 'createdBy', select: publicUserFields },
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
      .lean();
  }

  findOneWithUser(filterQuery: FilterQuery<Folder>): Promise<Folder | null> {
    return this.folderModel
      .findOne(filterQuery)
      .populate(folderUserPopulate)
      .lean();
  }
}
