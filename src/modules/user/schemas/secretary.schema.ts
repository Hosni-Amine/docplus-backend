import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { User, Doctor } from "@src/schemas";

@Schema({ versionKey: false , timestamps: true })
export class Secretary extends User {

    @Prop({ unique: true, type: Types.ObjectId, ref: 'Doctor' , required: true })
    doctor: Doctor;
}

export const SecretarySchema = SchemaFactory.createForClass(Secretary);