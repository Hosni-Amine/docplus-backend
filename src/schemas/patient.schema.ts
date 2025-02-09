import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { MedicalHistory, User, Appointment, Billing, MedicalInformation } from "@src/schemas";

@Schema({ versionKey: false })
export class Patient extends AbstractDocument {

    @Prop()
    thumbnail?: string;

    @Prop({ type: Types.ObjectId, ref: 'MedicalInformation' })
    medical_information?: MedicalInformation;

    @Prop({ type: [Types.ObjectId], ref: 'Billing' })
    billings?: Billing[];

    @Prop({ type: [Types.ObjectId], ref: 'Appointment' })
    appointments?: Appointment[]

    @Prop({ type: [Types.ObjectId], ref: 'MedicalHistory' })
    medical_histories?: MedicalHistory[]

    @Prop({ unique: true, type: Types.ObjectId, ref: 'Doctor' })
    doctor: User;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);