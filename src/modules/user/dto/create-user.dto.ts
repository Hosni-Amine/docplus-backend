import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateUserDTO {
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone_number?: string;

    @IsString()
    @IsOptional()
    fullname?: string;
}