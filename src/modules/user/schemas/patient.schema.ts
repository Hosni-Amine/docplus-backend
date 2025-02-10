import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { MedicalHistory, User, Appointment, Billing, Doctor } from "@src/schemas";

@Schema({ versionKey: false , timestamps: true })
export class Patient extends User {

    @Prop()
    insurance_provider?: string;
  
    @Prop()
    insurance_policy_num?: string;
  
    @Prop([{ type: String }])
    allergies: string[];
  
    @Prop([{ type: String }])
    current_medication: string[];
  
    @Prop()
    family_medical_history?: string;
  
    @Prop()
    past_medical_history?: string;

    @Prop({ type: [Types.ObjectId], ref: 'Billing' })
    billings?: Billing[];

    @Prop({ type: [Types.ObjectId], ref: 'Appointment' })
    appointments?: Appointment[]

    @Prop({ type: [Types.ObjectId], ref: 'MedicalHistory' })
    medical_histories?: MedicalHistory[]

    @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
    doctor: Doctor;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
PatientSchema.set('discriminatorKey', 'role');