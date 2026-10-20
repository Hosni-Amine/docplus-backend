import { AbstractDocument, EOfficeStatus } from '../../common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Office extends AbstractDocument {
  @Prop({ required: true })
  legalName: string;

  @Prop()
  phone?: string;

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
  email?: string;

  @Prop({ enum: EOfficeStatus, type: String, default: EOfficeStatus.ACTIVE })
  status: EOfficeStatus;
}

export const OfficeSchema = SchemaFactory.createForClass(Office);
