import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ERole, EUserStatus } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { deleteUploadedFile } from '../common/file-uploader';
import { User } from '../user/entities/user.entity';
import { listUserFields } from '../user/user.fields';
import { UserRepository } from '../user/user.repository';
import { OfficeRepository } from '../office/office.repository';
import { ChatGateway } from './chat.gateway';
import { ConversationRepository } from './conversation.repository';
import { CreateConversationInput } from './dto/create-conversation.input';
import { EditMessageInput } from './dto/edit-message.input';
import { SendMessageInput } from './dto/send-message.input';
import {
  Conversation,
  EConversationType,
} from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessageRepository } from './message.repository';

type Actor = {
  id?: string;
  officeId?: { toString(): string } | string;
};

export type ConversationWithUnread = Conversation & { unreadCount: number };

export interface GetContactsRes extends IBaseRes {
  contacts: User[];
}

export interface GetConversationsRes extends IBaseRes {
  conversations: ConversationWithUnread[];
}

export interface GetConversationRes extends IBaseRes {
  conversation: ConversationWithUnread | null;
}

export interface GetMessagesRes extends IBaseRes {
  messages: Message[];
  hasMore: boolean;
}

export interface GetMessageRes extends IBaseRes {
  chatMessage: Message | null;
}

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly userRepository: UserRepository,
    private readonly officeRepository: OfficeRepository,
    private readonly chatGateway: ChatGateway,
  ) {}

  /** A conversation of the actor's office where the actor is a participant. */
  private findOwnConversation(id: string, actor: Actor) {
    return this.conversationRepository.findOne({
      _id: id,
      officeId: actor.officeId,
      participants: new Types.ObjectId(actor.id),
    });
  }

  private async findOwnMessage(id: string, messageId: string, actor: Actor) {
    const conversation = await this.findOwnConversation(id, actor);
    if (!conversation) {
      return { conversation: null, message: null };
    }

    const message = await this.messageRepository.findOne({
      _id: messageId,
      conversationId: conversation._id,
      senderId: new Types.ObjectId(actor.id),
    });
    return { conversation, message };
  }

  private isLatestMessage(conversation: Conversation, message: Message) {
    if (!conversation.lastMessageAt || !message.created_at) {
      return false;
    }

    return (
      new Date(conversation.lastMessageAt).getTime() ===
        new Date(message.created_at).getTime() &&
      conversation.lastMessageSenderId?.toString() ===
        message.senderId.toString()
    );
  }

  private async syncLastMessagePreview(
    conversation: Conversation,
    message: Message,
    preview: { body: string; deleted: boolean },
  ) {
    if (!this.isLatestMessage(conversation, message)) {
      return;
    }

    await this.conversationRepository.findOneAndUpdate(
      { _id: conversation._id },
      {
        lastMessageBody: preview.body,
        lastMessageDeleted: preview.deleted,
      },
    );
  }

  private async withUnread(
    conversation: Conversation,
    actorId: string,
  ): Promise<ConversationWithUnread> {
    const lastReadAt = conversation.readBy.find(
      (reader) => reader.userId.toString() === actorId,
    )?.lastReadAt;

    const unreadCount = await this.messageRepository.countDocuments({
      conversationId: conversation._id,
      senderId: { $ne: new Types.ObjectId(actorId) },
      ...(lastReadAt && { created_at: { $gt: lastReadAt } }),
    });

    return { ...conversation, unreadCount };
  }

  /**
   * Active admins of the actor's office, except the actor.
   */
  async getContacts(actor: Actor): Promise<GetContactsRes> {
    try {
      if (!actor.officeId || !actor.id) {
        return { status: 403, message: 'OFFICE_REQUIRED', contacts: [] };
      }

      const contacts = await this.userRepository.find(
        {
          officeId: actor.officeId,
          role: ERole.ADMIN,
          status: EUserStatus.ACTIVE,
          _id: { $ne: new Types.ObjectId(actor.id) },
        },
        listUserFields,
      );
      return { status: 200, message: 'CONTACTS_FOUND_SUCCESSFULLY', contacts };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', contacts: [] };
    }
  }

  /**
   * The actor's conversations, last activity first, with unread counts.
   */
  async getConversations(actor: Actor): Promise<GetConversationsRes> {
    try {
      if (!actor.officeId || !actor.id) {
        return { status: 403, message: 'OFFICE_REQUIRED', conversations: [] };
      }

      await this.ensureOfficeGroup(actor);

      const list = await this.conversationRepository.findWithParticipants({
        officeId: actor.officeId,
        participants: new Types.ObjectId(actor.id),
      });
      const conversations = await Promise.all(
        list.map((conversation) =>
          this.withUnread(conversation, actor.id as string),
        ),
      );
      return {
        status: 200,
        message: 'CONVERSATIONS_FOUND_SUCCESSFULLY',
        conversations,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        conversations: [],
      };
    }
  }

  /**
   * Open the one-to-one conversation with an admin of the same office.
   * Returns the existing one when it already exists.
   */
  async createConversation(
    input: CreateConversationInput,
    actor: Actor,
  ): Promise<GetConversationRes> {
    try {
      if (!actor.officeId || !actor.id) {
        return { status: 403, message: 'OFFICE_REQUIRED', conversation: null };
      }
      if (input.participantId === actor.id) {
        return { status: 400, message: 'CHAT_NOT_ALLOWED', conversation: null };
      }

      const other = await this.userRepository.findOne({
        _id: input.participantId,
        officeId: actor.officeId,
        role: ERole.ADMIN,
        status: EUserStatus.ACTIVE,
      });
      if (!other) {
        return { status: 404, message: 'USER_NOT_FOUND', conversation: null };
      }

      const actorId = new Types.ObjectId(actor.id);
      const participants = [actorId, other._id];

      let conversation = await this.conversationRepository.findOne({
        officeId: actor.officeId,
        type: EConversationType.ONE_TO_ONE,
        participants: { $all: participants, $size: 2 },
      });

      const created = !conversation;
      if (!conversation) {
        const now = new Date();
        conversation = await this.conversationRepository.create({
          officeId: new Types.ObjectId(actor.officeId.toString()),
          type: EConversationType.ONE_TO_ONE,
          participants,
          readBy: participants.map((userId) => ({ userId, lastReadAt: now })),
          createdBy: actorId,
        });
      }

      const populated =
        await this.conversationRepository.findOneWithParticipants({
          _id: conversation._id,
        });
      return {
        status: created ? 201 : 200,
        message: created
          ? 'CONVERSATION_CREATED_SUCCESSFULLY'
          : 'CONVERSATION_FOUND_SUCCESSFULLY',
        conversation: populated
          ? await this.withUnread(populated, actor.id)
          : null,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        conversation: null,
      };
    }
  }

  /**
   * Messages of a conversation, oldest first, one page at a time.
   * `before` is the created_at of the oldest message already loaded.
   */
  async getMessages(
    id: string,
    actor: Actor,
    before?: string,
    limit?: string,
  ): Promise<GetMessagesRes> {
    try {
      const conversation = await this.findOwnConversation(id, actor);
      if (!conversation) {
        return {
          status: 404,
          message: 'CONVERSATION_NOT_FOUND',
          messages: [],
          hasMore: false,
        };
      }

      const size = Math.min(
        Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE,
      );
      const beforeDate = before ? new Date(before) : null;

      const page = await this.messageRepository.findPage(
        {
          conversationId: conversation._id,
          ...(beforeDate &&
            !Number.isNaN(beforeDate.getTime()) && {
              created_at: { $lt: beforeDate },
            }),
        },
        size + 1,
      );

      return {
        status: 200,
        message: 'MESSAGES_FOUND_SUCCESSFULLY',
        messages: page.slice(0, size).reverse(),
        hasMore: page.length > size,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        messages: [],
        hasMore: false,
      };
    }
  }

  /**
   * Save a message and push it to every participant over the socket.
   */
  async sendMessage(
    id: string,
    input: SendMessageInput,
    actor: Actor,
  ): Promise<GetMessageRes> {
    try {
      const conversation = await this.findOwnConversation(id, actor);
      if (!conversation) {
        return {
          status: 404,
          message: 'CONVERSATION_NOT_FOUND',
          chatMessage: null,
        };
      }

      const body = input.body?.trim() ?? '';
      const attachments = input.attachments ?? [];
      if (!body && !attachments.length) {
        return { status: 400, message: 'MESSAGE_EMPTY', chatMessage: null };
      }

      const prefix = `/uploads/chat/${conversation._id.toString()}/`;
      if (
        attachments.some((url) => !url.startsWith(prefix) || url.includes('..'))
      ) {
        return { status: 400, message: 'INVALID_FILE', chatMessage: null };
      }

      const actorId = new Types.ObjectId(actor.id);
      const chatMessage = await this.messageRepository.create({
        conversationId: conversation._id,
        officeId: conversation.officeId,
        senderId: actorId,
        body,
        attachments,
      });

      const sentAt = chatMessage.created_at ?? new Date();
      await this.conversationRepository.findOneAndUpdate(
        { _id: conversation._id },
        {
          lastMessageBody: body,
          lastMessageSenderId: actorId,
          lastMessageAt: sentAt,
          lastMessageDeleted: false,
        },
      );
      await this.conversationRepository.findOneAndUpdate(
        { _id: conversation._id, 'readBy.userId': actorId },
        { $set: { 'readBy.$.lastReadAt': sentAt } },
      );

      this.chatGateway.emitToUsers(
        conversation.participants.map((userId) => userId.toString()),
        'message:new',
        chatMessage,
      );

      return {
        status: 201,
        message: 'MESSAGE_SENT_SUCCESSFULLY',
        chatMessage,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        chatMessage: null,
      };
    }
  }

  /**
   * Edit the text of your own message.
   */
  async editMessage(
    id: string,
    messageId: string,
    input: EditMessageInput,
    actor: Actor,
  ): Promise<GetMessageRes> {
    try {
      const owned = await this.findOwnMessage(id, messageId, actor);
      if (!owned.conversation) {
        return {
          status: 404,
          message: 'CONVERSATION_NOT_FOUND',
          chatMessage: null,
        };
      }
      if (!owned.message) {
        return { status: 404, message: 'MESSAGE_NOT_FOUND', chatMessage: null };
      }
      if (owned.message.deletedAt) {
        return {
          status: 400,
          message: 'MESSAGE_ALREADY_DELETED',
          chatMessage: null,
        };
      }

      const body = input.body.trim();
      if (!body) {
        return { status: 400, message: 'MESSAGE_EMPTY', chatMessage: null };
      }

      const chatMessage = await this.messageRepository.findOneAndUpdate(
        { _id: owned.message._id },
        { body, editedAt: new Date() },
      );
      if (!chatMessage) {
        return { status: 404, message: 'MESSAGE_NOT_FOUND', chatMessage: null };
      }

      await this.syncLastMessagePreview(owned.conversation, chatMessage, {
        body,
        deleted: false,
      });

      this.chatGateway.emitToUsers(
        owned.conversation.participants.map((userId) => userId.toString()),
        'message:updated',
        chatMessage,
      );

      return {
        status: 200,
        message: 'MESSAGE_UPDATED_SUCCESSFULLY',
        chatMessage,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        chatMessage: null,
      };
    }
  }

  /**
   * Soft-delete your own message and remove its files.
   */
  async deleteMessage(
    id: string,
    messageId: string,
    actor: Actor,
  ): Promise<GetMessageRes> {
    try {
      const owned = await this.findOwnMessage(id, messageId, actor);
      if (!owned.conversation) {
        return {
          status: 404,
          message: 'CONVERSATION_NOT_FOUND',
          chatMessage: null,
        };
      }
      if (!owned.message) {
        return { status: 404, message: 'MESSAGE_NOT_FOUND', chatMessage: null };
      }
      if (owned.message.deletedAt) {
        return {
          status: 400,
          message: 'MESSAGE_ALREADY_DELETED',
          chatMessage: null,
        };
      }

      await deleteUploadedFile(owned.message.attachments);

      const chatMessage = await this.messageRepository.findOneAndUpdate(
        { _id: owned.message._id },
        { body: '', attachments: [], deletedAt: new Date() },
      );
      if (!chatMessage) {
        return { status: 404, message: 'MESSAGE_NOT_FOUND', chatMessage: null };
      }

      await this.syncLastMessagePreview(owned.conversation, chatMessage, {
        body: '',
        deleted: true,
      });

      this.chatGateway.emitToUsers(
        owned.conversation.participants.map((userId) => userId.toString()),
        'message:deleted',
        chatMessage,
      );

      return {
        status: 200,
        message: 'MESSAGE_DELETED_SUCCESSFULLY',
        chatMessage,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        chatMessage: null,
      };
    }
  }

  /**
   * Mark everything in the conversation as read for the actor.
   */
  async markAsRead(id: string, actor: Actor): Promise<IBaseRes> {
    try {
      const actorId = new Types.ObjectId(actor.id);
      const conversation = await this.conversationRepository.findOneAndUpdate(
        {
          _id: id,
          officeId: actor.officeId,
          participants: actorId,
          'readBy.userId': actorId,
        },
        { $set: { 'readBy.$.lastReadAt': new Date() } },
      );
      if (!conversation) {
        return { status: 404, message: 'CONVERSATION_NOT_FOUND' };
      }
      return { status: 200, message: 'CONVERSATION_READ_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  /**
   * One GROUP conversation per office, titled with the office name,
   * including every active office admin.
   */
  private async ensureOfficeGroup(actor: Actor) {
    const officeId = new Types.ObjectId(actor.officeId!.toString());
    const office = await this.officeRepository.findOne(
      { _id: officeId },
      { select: 'legalName' },
    );
    const title = office?.legalName?.trim() || 'Office';
    const admins = await this.userRepository.find(
      {
        officeId: actor.officeId,
        role: ERole.ADMIN,
        status: EUserStatus.ACTIVE,
      },
      listUserFields,
    );
    const participantIds = admins.map((user) => user._id);

    if (!participantIds.length) {
      return;
    }

    let existing = await this.conversationRepository.findOne({
      officeId,
      type: EConversationType.GROUP,
    });
    const now = new Date();

    if (!existing) {
      try {
        await this.conversationRepository.create({
          officeId,
          type: EConversationType.GROUP,
          title,
          participants: participantIds,
          readBy: participantIds.map((userId) => ({
            userId,
            lastReadAt: now,
          })),
          createdBy: new Types.ObjectId(actor.id),
        });
        return;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) {
          throw error;
        }
        existing = await this.conversationRepository.findOne({
          officeId,
          type: EConversationType.GROUP,
        });
        if (!existing) {
          return;
        }
      }
    }

    const existingIds = new Set(
      existing.participants.map((userId) => userId.toString()),
    );
    const missing = participantIds.filter(
      (userId) => !existingIds.has(userId.toString()),
    );

    if (!missing.length && existing.title === title) {
      return;
    }

    await this.conversationRepository.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: { title },
        ...(missing.length && {
          $addToSet: { participants: { $each: missing } },
          $push: {
            readBy: {
              $each: missing.map((userId) => ({ userId, lastReadAt: now })),
            },
          },
        }),
      },
    );
  }
}
