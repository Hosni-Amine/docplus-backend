import { Prop, Schema } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})
export class AbstractDocument {

    @Prop({ type: SchemaTypes.ObjectId })
    _id: Types.ObjectId;

    @Prop({ Type: Boolean, default: false })
    isDeleted?: boolean;

    @Prop({ type: Date })
    created_at?: Date;

    @Prop({ type: Date })
    updated_at?: Date;
}