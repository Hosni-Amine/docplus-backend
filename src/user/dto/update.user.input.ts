import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ESpokenLanguage, EUserStatus } from '../../common';
import { CreateUserInput } from './create-user.input';

export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['officeId'] as const),
) {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  midNames?: string[];

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  emailAppointmentReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  emailAppointmentConfirmations?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentWork?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  study?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(ESpokenLanguage, { each: true })
  languages?: ESpokenLanguage[];

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsEnum(EUserStatus)
  status?: EUserStatus;
}
