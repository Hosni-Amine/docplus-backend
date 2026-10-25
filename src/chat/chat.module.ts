import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { OfficeModule } from '../office/office.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConversationRepository } from './conversation.repository';
import {
  Conversation,
  ConversationSchema,
} from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { MessageRepository } from './message.repository';

@Module({
  imports: [
    DatabaseModule,
    OfficeModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ConversationRepository,
    MessageRepository,
  ],
})
export class ChatModule {}
