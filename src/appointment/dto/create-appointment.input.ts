import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentInput {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

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
