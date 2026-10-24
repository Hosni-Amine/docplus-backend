import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { publicUserFields } from '../user/user.fields';
import { FolderDocument } from './entities/document.entity';

const documentUserPopulate = [
  { path: 'createdBy', select: publicUserFields },
  { path: 'lastUpdatedBy', select: publicUserFields },
];

@Injectable()
export class DocumentRepository extends AbstractRepository<FolderDocument> {
  protected readonly logger = new Logger(DocumentRepository.name);

  constructor(
    @InjectModel(FolderDocument.name)
    private readonly documentModel: Model<FolderDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(documentModel, connection);
  }

  findWithUser(
    filterQuery: FilterQuery<FolderDocument>,
  ): Promise<FolderDocument[]> {
    return this.documentModel
      .find(filterQuery)
      .sort({ date: -1 })
      .populate(documentUserPopulate)
      .lean();
  }

  findOneWithUser(
    filterQuery: FilterQuery<FolderDocument>,
  ): Promise<FolderDocument | null> {
    return this.documentModel
      .findOne(filterQuery)
      .populate(documentUserPopulate)
      .lean();
  }
}
