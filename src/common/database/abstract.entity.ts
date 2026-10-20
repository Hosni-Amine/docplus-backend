import { Prop } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

export class AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  created_at?: Date;
  updated_at?: Date;
}
