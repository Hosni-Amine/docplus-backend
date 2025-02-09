import { AbstractDocument, EBillingStatus } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Doctor, Patient } from "@src/schemas";

@Schema({ versionKey: false })
export class Billing extends AbstractDocument {
    @Prop({ type: Types.ObjectId, ref: 'Doctor' })
    doctor: Doctor;

    @Prop({ type: Types.ObjectId, ref: 'Patient' })
    patient: Patient;

    @Prop({ default: 0 })
    ammount: number;

    @Prop()
    due_date: Date;

    @Prop({ enum: ["PAID", "PARTIALLY_PAID", "OVERDUE", "REFUNDED", "CANCELED"], type: String })
    status: EBillingStatus;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);