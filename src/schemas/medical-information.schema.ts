import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ versionKey: false })
export class MedicalInformation extends AbstractDocument {
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

  @Prop({ unique: true, type: String, ref: "Patient" })
  patient_id: string;
}

export const MedicalInformationSchema = SchemaFactory.createForClass(MedicalInformation);
