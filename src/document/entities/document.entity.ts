import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractDocument } from '../../common';

@Schema({
  collection: 'documents',
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class FolderDocument extends AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Folder', required: true })
  folderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office', required: true })
  officeId: Types.ObjectId;

  /** Free text chosen by the office (exam, visit, prescription...). */
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  title: string;

  /** Date of the exam or visit, not the upload date. */
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop()
  author?: string;

  @Prop()
  notes?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  /** URLs returned by the upload route. */
  @Prop({ type: [String], default: [] })
  files: string[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  lastUpdatedBy: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const FolderDocumentSchema =
  SchemaFactory.createForClass(FolderDocument);
