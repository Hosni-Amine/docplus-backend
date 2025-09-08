import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class SigninReqInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(6, 50)
  password: string;
}

export class ConfirmUserReqInput {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @Length(6, 50)
  password: string;
}

export class RequestResetPasswordReqInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
