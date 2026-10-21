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

  /**
   * Weekly office hours. Times are "HH:mm" (24h).
   * Example: { monday: { enabled: true, start: "09:00", end: "17:00" }, ... }
   */
  @Prop({ type: Object, default: null })
  workingHours?: {
    monday?: { enabled: boolean; start: string; end: string };
    tuesday?: { enabled: boolean; start: string; end: string };
    wednesday?: { enabled: boolean; start: string; end: string };
    thursday?: { enabled: boolean; start: string; end: string };
    friday?: { enabled: boolean; start: string; end: string };
    saturday?: { enabled: boolean; start: string; end: string };
    sunday?: { enabled: boolean; start: string; end: string };
  } | null;
}

export const OfficeSchema = SchemaFactory.createForClass(Office);

OfficeSchema.virtual('officeUsers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'officeId',
});
