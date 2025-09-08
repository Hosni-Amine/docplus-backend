import { AbstractDocument, ERole } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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
  password?: string;

  @Prop()
  phone?: string;

  @Prop()
  fullname?: string;

  @Prop({ enum: ERole, type: String })
  role: ERole;

  @Prop({ default: false })
  is_verified: boolean;

  @Prop({ default: false })
  is_completed: boolean;

  @Prop({ nullable: true })
  confirmation_token?: string;

  @Prop({ nullable: true })
  confirmation_token_validity?: Date;

  @Prop()
  address?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
