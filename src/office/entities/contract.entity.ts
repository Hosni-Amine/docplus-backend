import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractDocument, EContractStatus, EOfficePlan } from '../../common';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Contract extends AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Office', required: true })
  officeId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    enum: EContractStatus,
    type: String,
    default: EContractStatus.ACTIVE,
  })
  status: EContractStatus;

  @Prop({ enum: EOfficePlan, type: String })
  plan?: EOfficePlan;

  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  documents: string[];
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

ContractSchema.index({ officeId: 1, startDate: -1 });
