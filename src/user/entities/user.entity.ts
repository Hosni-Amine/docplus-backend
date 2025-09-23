import { AbstractDocument, ERole } from '@common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Office } from '@src/office/entities/office.entity';

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
  photo?: string;

  @Prop()
  phone?: string;

  @Prop()
  fullname?: string;

  @Prop({ enum: ERole, type: String })
  role: ERole;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ nullable: true })
  otp_code?: string;

  @Prop({ nullable: true })
  otp_expires_at?: Date;

  @Prop({ nullable: true })
  otp_confirmation_token?: string;

  @Prop()
  address?: string;

  @Prop({ type: Types.ObjectId, ref: 'Office', nullable: true })
  office?: Office;
}

export const UserSchema = SchemaFactory.createForClass(User);
