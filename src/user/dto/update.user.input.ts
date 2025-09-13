import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { ERole } from '@common/enums';

export class UpdateUserInput {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  role?: ERole;
}
