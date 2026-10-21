import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { EUserStatus } from '../../common';
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
  @IsArray()
  @IsString({ each: true })
  currentWork?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  study?: string[];

  @IsOptional()
  @IsEnum(EUserStatus)
  status?: EUserStatus;
}
