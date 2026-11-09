import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestDemoOtpInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;
}
