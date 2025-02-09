import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateUserDTO {
    @IsEmail()
    email: string;

    @IsString()
    phone_number: string;

    @IsString()
    @IsOptional()
    fullname?: string;

    // Note: We don't include role, is_verified, is_completed, or confirmation_token
    // as these are handled internally by the service
    
    // Also don't include references (doctor, secretary, patient)
    // as these are managed by the service layer
} 