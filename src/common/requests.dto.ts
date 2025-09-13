import { IsEmail, IsNotEmpty, Length, IsString } from 'class-validator';

export class RequestOtpReqInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifyOtpReqInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(36, 36)
  otp_confirmation_token: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp_code: string;
}
