import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, Length } from "class-validator";
import { ERole } from "./enums";

export class SigninReqDTO {
    @IsNotEmpty()
    @IsEmail()
    login: string;

    @IsNotEmpty()
    @Length(6, 50)
    password: string;
}

export class SignupReqDTO {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @Length(6, 50)
    password: string;

    @IsPhoneNumber()
    @IsOptional()
    phone: string;

    @IsOptional()
    fullname?: string;

    @IsNotEmpty()
    role: ERole;
}

export class ConfirmReqDTO {
    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    @Length(6, 50)
    password: string;
}

export class RequestResetPasswordReqDTO {
    @IsNotEmpty()
    @IsEmail()
    email: string;
}