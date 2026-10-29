import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractDocument } from '../../common';
import { Message } from './message.entity';

export enum EConversationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  GROUP = 'GROUP',
}

export class ConversationReader {
  userId: Types.ObjectId;
  lastReadAt: Date;
}

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Conversation extends AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office', required: true })
  officeId: Types.ObjectId;

  @Prop({
    enum: EConversationType,
    type: String,
    default: EConversationType.ONE_TO_ONE,
  })
  type: EConversationType;

  /** Office name for the default group conversation. */
  @Prop()
  title?: string;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  /** Messages after lastReadAt (not sent by that user) are unread. */
  @Prop({
    type: [
      {
        _id: false,
        userId: { type: SchemaTypes.ObjectId, ref: 'User' },
        lastReadAt: Date,
      },
    ],
    default: [],
  })
  readBy: ConversationReader[];

  /** Preview of the last message, for the conversation list. */
  @Prop()
  lastMessageBody?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  lastMessageSenderId?: Types.ObjectId;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  @Prop({ default: false })
  lastMessageDeleted?: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  messages?: Message[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId',
  options: { sort: { created_at: 1 } },
});

ConversationSchema.index({ officeId: 1, participants: 1, lastMessageAt: -1 });
ConversationSchema.index(
  { officeId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: EConversationType.GROUP } },
);
