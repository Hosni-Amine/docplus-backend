import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractDocument } from '../../common';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Message extends AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office', required: true })
  officeId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ default: '' })
  body: string;

  /** URLs returned by the upload route (folder "chat", subfolder = conversation id). */
  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Date })
  editedAt?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, created_at: -1 });
