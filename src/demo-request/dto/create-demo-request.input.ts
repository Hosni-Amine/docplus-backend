import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDemoRequestInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  legalName?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsString()
  @IsNotEmpty()
  otp_code: string;

  @IsString()
  @IsNotEmpty()
  otp_confirmation_token: string;

  @IsString()
  @IsOptional()
  note?: string;
}
