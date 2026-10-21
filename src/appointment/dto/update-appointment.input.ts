import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateAppointmentInput } from './create-appointment.input';

export class UpdateAppointmentInput extends PartialType(
  CreateAppointmentInput,
) {
  @IsString()
  @IsNotEmpty()
  id: string;
}
