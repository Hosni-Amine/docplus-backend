import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { IBaseRes } from '../common/responses.dto';
import { CreateConversationInput } from './dto/create-conversation.input';
import { EditMessageInput } from './dto/edit-message.input';
import { SendMessageInput } from './dto/send-message.input';
import {
  ChatService,
  GetContactsRes,
  GetMessageRes,
  GetMessagesRes,
  GetConversationRes,
  GetConversationsRes,
} from './chat.service';

type Actor = {
  id?: string;
  officeId?: string;
};

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('contacts')
  async getContacts(@CurrentUser() actor: Actor): Promise<GetContactsRes> {
    return this.chatService.getContacts(actor);
  }

  @Get('conversations')
  async getConversations(
    @CurrentUser() actor: Actor,
  ): Promise<GetConversationsRes> {
    return this.chatService.getConversations(actor);
  }

  @Post('conversations')
  async createConversation(
    @Body() input: CreateConversationInput,
    @CurrentUser() actor: Actor,
  ): Promise<GetConversationRes> {
    return this.chatService.createConversation(input, actor);
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<GetConversationRes> {
    return this.chatService.getConversationById(id, actor);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ): Promise<GetMessagesRes> {
    return this.chatService.getMessages(id, actor, before, limit);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() input: SendMessageInput,
    @CurrentUser() actor: Actor,
  ): Promise<GetMessageRes> {
    return this.chatService.sendMessage(id, input, actor);
  }

  @Patch('conversations/:id/messages/:messageId')
  async editMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() input: EditMessageInput,
    @CurrentUser() actor: Actor,
  ): Promise<GetMessageRes> {
    return this.chatService.editMessage(id, messageId, input, actor);
  }

  @Delete('conversations/:id/messages/:messageId')
  async deleteMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() actor: Actor,
  ): Promise<GetMessageRes> {
    return this.chatService.deleteMessage(id, messageId, actor);
  }

  @Patch('conversations/:id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<IBaseRes> {
    return this.chatService.markAsRead(id, actor);
  }
}
