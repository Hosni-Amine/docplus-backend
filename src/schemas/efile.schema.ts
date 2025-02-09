import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ versionKey: false })
export class Efile extends AbstractDocument {
    @Prop()
    file_title: string;

    @Prop()
    file_type: string;

    @Prop()
    file_name: string;

    @Prop()
    original_name: string;

    @Prop()
    file_size: number;

    @Prop()
    url: string;
}

export const EfileSchema = SchemaFactory.createForClass(Efile);