import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractDocument, ERole, EUserStatus } from '../../common';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User extends AbstractDocument {
  @Prop()
  email?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  phone?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ type: [String], default: [] })
  midNames?: string[];

  @Prop({ enum: ERole, type: String })
  role: ERole;

  @Prop({ enum: EUserStatus, type: String, default: EUserStatus.ACTIVE })
  status: EUserStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office' })
  officeId?: Types.ObjectId;

  @Prop({ nullable: true })
  otp_code?: string;

  @Prop({ nullable: true })
  otp_expires_at?: Date;

  @Prop({ nullable: true })
  otp_confirmation_token?: string;

  @Prop({ default: 0 })
  otp_attempts?: number;

  /**
   * Copied into the JWT at login. Increased on logout, email change,
   * role change, block, or delete. The guard rejects the token when
   * this no longer matches the value inside it.
   */
  @Prop({ default: 0 })
  tokenVersion?: number;

  @Prop()
  address?: string;

  @Prop()
  country?: string;

  @Prop()
  state?: string;

  @Prop()
  city?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  about?: string;

  @Prop()
  notes?: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: [String], default: [] })
  currentWork?: string[];

  @Prop({ type: [String], default: [] })
  study?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
