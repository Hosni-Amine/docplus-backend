import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractDocument, EConsultationType } from '../../common';

export enum EAppointmentRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Schema({
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class AppointmentRequest extends AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office', required: true })
  officeId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  firstName: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  lastName: string;

  @Prop({ lowercase: true, trim: true, maxlength: 254 })
  email?: string;

  @Prop({ trim: true, maxlength: 32 })
  phone?: string;

  @Prop({ type: Date, required: true })
  start: Date;

  @Prop({ type: Date, required: true })
  end: Date;

  @Prop({
    type: String,
    enum: Object.values(EConsultationType),
    default: EConsultationType.IN_OFFICE,
  })
  consultationType: EConsultationType;

  @Prop({
    type: String,
    enum: Object.values(EAppointmentRequestStatus),
    default: EAppointmentRequestStatus.PENDING,
  })
  status: EAppointmentRequestStatus;

  /** Office admins who opened this request in the notification bell. */
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'User', default: [] })
  seenBy?: Types.ObjectId[];
}

export const AppointmentRequestSchema =
  SchemaFactory.createForClass(AppointmentRequest);
AppointmentRequestSchema.index({ adminId: 1, status: 1, start: 1 });
AppointmentRequestSchema.index({ email: 1, created_at: -1 });
/** One pending request per patient email and doctor. */
AppointmentRequestSchema.index(
  { adminId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: EAppointmentRequestStatus.PENDING },
  },
);
/** One pending request per patient phone and doctor. */
AppointmentRequestSchema.index(
  { adminId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { status: EAppointmentRequestStatus.PENDING },
  },
);
