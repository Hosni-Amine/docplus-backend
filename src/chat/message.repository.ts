import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageRepository extends AbstractRepository<Message> {
  protected readonly logger = new Logger(MessageRepository.name);

  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectConnection() connection: Connection,
  ) {
    super(messageModel, connection);
  }

  /** Newest first, `limit` items. */
  findPage(
    filterQuery: FilterQuery<Message>,
    limit: number,
  ): Promise<Message[]> {
    return this.messageModel
      .find(filterQuery)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
  }
}
