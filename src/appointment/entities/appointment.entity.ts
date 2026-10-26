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
export class Appointment extends AbstractDocument {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  color?: string;

  @Prop({ type: Boolean, default: false })
  allDay: boolean;

  @Prop({ type: Date, required: true })
  start: Date;

  @Prop({ type: Date, required: true })
  end: Date;

  /** Attendee user (role USER). */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** Staff / Doctor admin (role ADMIN). */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  adminId?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office', required: true })
  officeId: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
