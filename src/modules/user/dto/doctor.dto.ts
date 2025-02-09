import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { CreateUserDTO } from './user.dto';

export class CreateDoctorDTO extends CreateUserDTO {
    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsNotEmpty()
    @IsString()
    doctor_id?: string;
}

export class UpdateDoctorDTO extends CreateDoctorDTO {
    /* @IsOptional()
    medical_information?: Types.ObjectId;

    @IsOptional()
    billings?: Types.ObjectId[];

    @IsOptional()
    appointments?: Types.ObjectId[];

    @IsOptional()
    medical_histories?: Types.ObjectId[]; */
}