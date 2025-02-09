import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { CreateUserDTO } from './create-user.dto';

export class CreatePatientDTO extends CreateUserDTO {
    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsNotEmpty()
    @IsString()
    doctor_id?: string;
}

export class UpdatePatientDTO extends CreatePatientDTO {
    @IsOptional()
    medical_information?: Types.ObjectId;

    @IsOptional()
    billings?: Types.ObjectId[];

    @IsOptional()
    appointments?: Types.ObjectId[];

    @IsOptional()
    medical_histories?: Types.ObjectId[];
}