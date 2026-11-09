import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument, EDemoRequestStatus } from '../../common';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class DemoRequest extends AbstractDocument {
  /** Email address (verified via OTP). Every email can only have one active request. */
  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  /** Legal name of the clinic / cabinet / facility. */
  @Prop({ trim: true })
  legalName?: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  service?: string;

  @Prop({
    enum: EDemoRequestStatus,
    type: String,
    default: EDemoRequestStatus.PENDING_APPROVAL,
  })
  status: EDemoRequestStatus;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ nullable: true })
  otp_code?: string;

  @Prop({ nullable: true })
  otp_expires_at?: Date;

  @Prop({ nullable: true })
  otp_confirmation_token?: string;

  @Prop({ default: 0 })
  otp_attempts?: number;

  @Prop({ default: false })
  is_email_verified?: boolean;

  @Prop()
  note?: string;
}

export const DemoRequestSchema = SchemaFactory.createForClass(DemoRequest);
