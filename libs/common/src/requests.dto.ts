import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, Length } from "class-validator";
import { ERole } from "./enums";

/***
 *  Auth Module
 */
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

    @IsPhoneNumber('TN')
    phoneNumber: string;

    @IsOptional()
    fullname?: string;

    @IsNotEmpty()
    role: ERole;
}

export class ConfirmReqDTO {
    @IsNotEmpty()
    token: string;
}

/***
 *  User Module
 */