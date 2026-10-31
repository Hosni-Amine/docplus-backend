import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ECareRecipientLabel, EOfficeService } from '../../common';
import { WorkingHoursDto } from './working-hours.dto';

export class CreateOfficeInput {
  @IsString()
  @IsNotEmpty()
  legalName: string;

  @IsOptional()
  @IsEnum(EOfficeService)
  service?: EOfficeService;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  /** IANA timezone (e.g. Europe/Paris). */
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ECareRecipientLabel)
  careRecipientLabel?: ECareRecipientLabel;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;
}
