import { AbstractDocument, EBillingStatus } from '@common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '@src/schemas';

@Schema({ versionKey: false })
export class Billing extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  doctor: User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  patient: User;

  @Prop({ default: 0 })
  ammount: number;

  @Prop()
  due_date: Date;

  @Prop({
    enum: ['PAID', 'PARTIALLY_PAID', 'OVERDUE', 'REFUNDED', 'CANCELED'],
    type: String,
  })
  status: EBillingStatus;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
