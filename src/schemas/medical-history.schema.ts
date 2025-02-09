import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Doctor, Patient } from '@src/schemas';

@Schema({ versionKey: false })
export class MedicalHistory extends AbstractDocument {
    @Prop({type: Types.ObjectId, ref: 'Patient'})
    patient: Patient;

    @Prop({type: Types.ObjectId, ref: 'Doctor'})
    doctor: Doctor;

    @Prop({type: Date, default: Date.now})
    date: Date;

    @Prop()
    description?: string;

    @Prop()
    prescription?: string;

    @Prop()
    diagnosis?: string;

    @Prop()
    documents?: string[];
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory);