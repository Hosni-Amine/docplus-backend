import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreatePatientInput } from './create-patient.input';

export class UpdatePatientInput extends PartialType(CreatePatientInput) {
  @IsString()
  @IsNotEmpty()
  id: string;
}
