import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EConsultationType } from '../../common';

export class CreateAppointmentInput {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsEnum(EConsultationType)
  @IsNotEmpty()
  consultationType: EConsultationType;

  @IsDateString()
  @IsNotEmpty()
  start: string;

  @IsDateString()
  @IsNotEmpty()
  end: string;

  /** Attendee user id (role USER). */
  @IsString()
  @IsNotEmpty()
  userId: string;

  /** Staff / Doctor admin id (role ADMIN). */
  @IsOptional()
  @IsString()
  adminId?: string;
}
