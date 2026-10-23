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
export class Folder extends AbstractDocument {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop()
  notes?: string;

  /** Patient or office staff. One user, chosen when the folder is created. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office', required: true })
  officeId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  lastUpdatedBy: Types.ObjectId;

  /** Set when the folder comes from a visit. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  /** URLs returned by the upload route. */
  @Prop({ type: [String], default: [] })
  files: string[];

  /** Emails the folder is shared with. */
  @Prop({ type: [String], default: [] })
  shared: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: false })
  isFavorited: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
