import { AbstractDocument, ERole } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Billing } from "@src/schemas";
import { Appointment } from "@src/schemas";
import { Types } from "mongoose";

@Schema({ versionKey: false })
export class User extends AbstractDocument {

    @Prop() 
    email?: string;

    @Prop() 
    photo?: string;

    @Prop()
    password?: string;

    @Prop()
    phone?: string;

    @Prop()
    fullname?: string;

    @Prop({ enum: ERole, type: String })
    role: ERole;

    @Prop({ default: false })
    is_verified: boolean;

    @Prop({ default: false })
    is_completed: boolean;

    @Prop({ unique: true })
    confirmation_token: string;

    @Prop({ unique: true })
    confirmation_token_validity?: Date;

    @Prop()
    last_login?: Date;

    @Prop()
    address?: string;

    @Prop([{ type: [Types.ObjectId], ref: 'Appointment', nullable: true }])
    appointments?: Appointment[];

    @Prop([{ type: [Types.ObjectId], ref: 'Billing', nullable: true }])
    billings?: Billing[];

    @Prop({ type: Types.ObjectId, ref: 'User' })
    doctor?: User;
}

export const UserSchema = SchemaFactory.createForClass(User);
