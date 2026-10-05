import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OmitType, PartialType } from '@nestjs/swagger';
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
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  midNames?: string[];

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

  @IsOptional()
  @IsString()
  about?: string;

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
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
