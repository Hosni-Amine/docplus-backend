import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { listUserFields } from '../user/user.fields';
import { Conversation } from './entities/conversation.entity';

const participantsPopulate = { path: 'participants', select: listUserFields };

@Injectable()
export class ConversationRepository extends AbstractRepository<Conversation> {
  protected readonly logger = new Logger(ConversationRepository.name);

  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectConnection() connection: Connection,
  ) {
    super(conversationModel, connection);
  }

  findWithParticipants(
    filterQuery: FilterQuery<Conversation>,
  ): Promise<Conversation[]> {
    return this.conversationModel
      .find(filterQuery)
      .sort({ lastMessageAt: -1, created_at: -1 })
      .populate(participantsPopulate)
      .lean();
  }

  findOneWithParticipants(
    filterQuery: FilterQuery<Conversation>,
  ): Promise<Conversation | null> {
    return this.conversationModel
      .findOne(filterQuery)
      .populate(participantsPopulate)
      .lean();
  }
}
