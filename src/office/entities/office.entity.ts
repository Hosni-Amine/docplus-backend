import {
  AbstractDocument,
  ECareRecipientLabel,
  EOfficeService,
  EOfficeAccessibility,
  EOfficePaymentMethod,
  EOfficeStatus,
  ERole,
  EUserStatus,
} from '../../common';
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

  /** Medical office / facility / department type. */
  @Prop({ enum: EOfficeService, type: String })
  service?: EOfficeService;

  @Prop({ type: Object, default: undefined })
  legalDetails?: Record<string, string>;

  /** Selected office payment methods. */
  @Prop({ type: [String], enum: EOfficePaymentMethod, default: undefined })
  paymentMethods?: EOfficePaymentMethod[];

  @Prop({ type: Object, default: undefined })
  fees?: Record<string, string>;

  @Prop({ type: [String], default: undefined })
  refundMethods?: string[];

  @Prop()
  currency?: string;

  /** Selected accessibility options. */
  @Prop({ type: [String], enum: EOfficeAccessibility, default: undefined })
  accessibility?: EOfficeAccessibility[];

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

  /** Geo coordinates for map / distance search. */
  @Prop()
  lat?: number;

  @Prop()
  lng?: number;

  /**
   * IANA timezone for this office location (e.g. Europe/Paris).
   * Working hours and reminder emails use this; falls back to APP_TIMEZONE.
   */
  @Prop()
  timezone?: string;

  @Prop()
  email?: string;

  @Prop({ enum: EOfficeStatus, type: String, default: EOfficeStatus.ACTIVE })
  status: EOfficeStatus;

  /**
   * How this office refers to role USER in the UI (patient vs client).
   */
  @Prop({
    enum: ECareRecipientLabel,
    type: String,
    default: ECareRecipientLabel.PATIENT,
  })
  careRecipientLabel: ECareRecipientLabel;

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

OfficeSchema.virtual('officeAdmins', {
  ref: 'User',
  localField: '_id',
  foreignField: 'officeId',
  match: { role: ERole.ADMIN, status: { $ne: EUserStatus.DELETED } },
});

OfficeSchema.virtual('adminsCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'officeId',
  count: true,
  match: { role: ERole.ADMIN, status: { $ne: EUserStatus.DELETED } },
});

OfficeSchema.virtual('usersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'officeId',
  count: true,
  match: { role: ERole.USER, status: { $ne: EUserStatus.DELETED } },
});
