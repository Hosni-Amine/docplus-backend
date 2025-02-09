import { AbstractDocument, ERole } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Secretary, Doctor } from "@src/schemas";

@Schema({ versionKey: false })
export class User extends AbstractDocument {
    @Prop() 
    email?: string;

    @Prop()
    password?: string;

    @Prop({ default: '00-000-000' })
    phone_number?: string;

    @Prop()
    username?: string;

    @Prop()

    fullname?: string;

    @Prop({ enum: ["DOCTOR", "PATIENT", "SECRETARY", "ADMIN"], type: String })
    role: /* "DOCTOR" | "PATIENT" | "SECRETARY" | "ADMIN" */ERole;

    @Prop({ default: false })
    is_verified: boolean;

    @Prop({ default: false })
    is_completed: boolean;

    @Prop({ unique: true })
    confirmation_token: string;

    @Prop({ type: Types.ObjectId, ref: 'Doctor' })
    doctor?: Doctor;

    @Prop({ type: Types.ObjectId, ref: 'Secretary' })
    secretary?: Secretary;

    @Prop({ type: Types.ObjectId, ref: 'Patient' })
    patient?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
