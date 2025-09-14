import { AbstractDocument } from '@common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum EOfficeType {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  CLINIC = 'CLINIC',
  HOSPITAL = 'HOSPITAL',
}

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

  @Prop({ required: true })
  address: string;

  @Prop()
  city?: string;

  @Prop()
  postalCode?: string;

  @Prop()
  country?: string;

  @Prop()
  fixed_phone?: string;

  @Prop()
  email?: string;

  @Prop()
  website?: string;

  @Prop({ enum: EOfficeType, default: EOfficeType.PRIVATE })
  type: EOfficeType;

  @Prop({ type: Object })
  openingHours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };

  @Prop({ type: [String] })
  images?: string[];

  @Prop({ type: [String] })
  specializations?: string[];

  @Prop({ type: [String] })
  insuranceAccepted?: string[];
}

export const OfficeSchema = SchemaFactory.createForClass(Office);
