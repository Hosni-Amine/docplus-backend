import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOfficeInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
