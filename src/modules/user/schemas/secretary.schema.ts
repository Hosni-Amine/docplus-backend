import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Doctor, User } from "@src/schemas";

@Schema({ versionKey: false })
export class Secretary extends AbstractDocument {
    @Prop({ unique: true, type: Types.ObjectId, ref: 'Doctor' })
    doctor: Doctor;

    @Prop({ unique: true, type: Types.ObjectId, ref: 'User' })
    user: User;

    @Prop()
    bio?: string;

    @Prop()
    thumbnail?: string;
}

export const SecretarySchema = SchemaFactory.createForClass(Secretary);