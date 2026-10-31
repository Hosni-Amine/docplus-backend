import {
  IsArray,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EMedicalSpecialty, EOfficeStaffRole, ERole } from '../../common';

export class CreateUserInput {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

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
  notes?: string;

  @IsNotEmpty()
  @IsEnum(ERole)
  role: ERole;

  @IsOptional()
  @IsEnum(EOfficeStaffRole)
  officeStaffRole?: EOfficeStaffRole;

  @IsOptional()
  @IsArray()
  @IsEnum(EMedicalSpecialty, { each: true })
  specialty?: EMedicalSpecialty[];

  @IsOptional()
  @IsMongoId()
  officeId?: string;
}
