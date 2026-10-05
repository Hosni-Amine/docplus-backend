import { AbstractDocument } from '../../common';
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
  name: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  email?: string;
}

export const OfficeSchema = SchemaFactory.createForClass(Office);
