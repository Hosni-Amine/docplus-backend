import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import {
  AbstractDocument,
  EConsultationType,
  EMeetingStatus,
} from '../../common';

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

  /** Notes added during consultation sessions. */
  @Prop()
  notes?: string;

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

  @Prop({
    type: String,
    enum: Object.values(EConsultationType),
    default: EConsultationType.IN_OFFICE,
    required: true,
  })
  consultationType: EConsultationType;

  @Prop({
    type: String,
    enum: Object.values(EMeetingStatus),
    default: EMeetingStatus.SCHEDULED,
  })
  meetingStatus?: EMeetingStatus;

  @Prop({ type: String })
  meetingRoom?: string;

  /** Sessions already minted from the attendee's invite link. */
  @Prop({ type: Number, default: 0 })
  inviteExchangeCount?: number;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

AppointmentSchema.virtual('admin', {
  ref: 'User',
  localField: 'adminId',
  foreignField: '_id',
  justOne: true,
});
