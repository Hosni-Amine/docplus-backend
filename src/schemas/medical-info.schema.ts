import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { User } from "@src/user/schemas/user.schema";

export interface MedicalHistory {
    date: Date;
    description?: string;
    prescription?: string;
    diagnosis?: string;
    documents?: string[];
}

@Schema({ versionKey: false , timestamps: true })
export class MedicationInformation {

    @Prop({ type: Types.ObjectId, ref: 'User' })
    patient?: User;

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

    @Prop({ type: [Types.ObjectId], ref: 'MedicalHistory' })
    medical_histories?: MedicalHistory[]
}

export const MedicationInformationSchema = SchemaFactory.createForClass(MedicationInformation);
