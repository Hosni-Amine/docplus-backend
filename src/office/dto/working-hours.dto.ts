import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

const TIME_HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class WorkingDayHoursDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @Matches(TIME_HH_MM, { message: 'INVALID_TIME' })
  start: string;

  @IsString()
  @Matches(TIME_HH_MM, { message: 'INVALID_TIME' })
  end: string;
}

export class WorkingHoursDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingDayHoursDto)
  monday?: WorkingDayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingDayHoursDto)
  tuesday?: WorkingDayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingDayHoursDto)
  wednesday?: WorkingDayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingDayHoursDto)
  thursday?: WorkingDayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingDayHoursDto)
  friday?: WorkingDayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingDayHoursDto)
  saturday?: WorkingDayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingDayHoursDto)
  sunday?: WorkingDayHoursDto;
}
