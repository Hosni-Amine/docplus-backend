import { AbstractDocument, EAppointmentStatus } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '@src/user/entities/user.entity';

@Schema({ versionKey: false })
export class Appointment extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  patient: User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  doctor: User;

  @Prop()
  date: Date;

  @Prop({ enum: ['PENDING', 'FULLFILLED', 'DONE', 'CANCELED'], type: String })
  status: EAppointmentStatus;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
