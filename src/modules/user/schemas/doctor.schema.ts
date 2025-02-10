import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Billing, Appointment, User } from "@src/schemas";

@Schema({ versionKey: false , timestamps: true })
export class Doctor extends User {
    @Prop()
    speciality: string;

    @Prop()
    location_address?: string;
    
    @Prop()
    bio?: string;

    @Prop([{ type: [Types.ObjectId], ref: 'Appointment' }])
    appointments: Appointment[];

    @Prop([{ type: [Types.ObjectId], ref: 'Billing' }])
    billings: Billing[];
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);