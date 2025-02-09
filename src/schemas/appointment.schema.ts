import { AbstractDocument, EAppointmentStatus } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Patient, Doctor } from "@src/schemas";

@Schema({ versionKey: false })
export class Appointment extends AbstractDocument {
    @Prop({ type: Types.ObjectId, ref: 'Patient' })
    patient: Patient;

    @Prop({ type: Types.ObjectId, ref: 'Doctor' })
    doctor: Doctor;

    @Prop()
    date: Date;

    @Prop({ enum: ["PENDING", "FULLFILLED", "DONE", "CANCELED"], type: String })
    status: EAppointmentStatus;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);