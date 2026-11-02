import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EMedicalSpecialty } from '../../common';

export class PublicDoctorFilterInput {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(EMedicalSpecialty)
  specialty?: EMedicalSpecialty;

  @IsOptional()
  @IsString()
  address?: string;
}
