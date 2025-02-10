import { IsString, IsOptional, IsNotEmpty, IsArray } from 'class-validator';
import { Types } from 'mongoose';
import { CreateUserDTO } from './user.dto';

//http://localhost:4000/api/user/patient
export class CreatePatientDTO extends CreateUserDTO {
    
    @IsOptional()
    @IsString()
    insurance_provider?: string;
  
    @IsOptional()
    insurance_policy_num?: string;
  
    @IsOptional()
    @IsArray()
    allergies: string[];
  
    @IsOptional()
    @IsArray()
    current_medication: string[];
  
    @IsOptional()
    @IsString()
    family_medical_history?: string;
  
    @IsOptional()
    @IsString()
    past_medical_history?: string;

    @IsNotEmpty()
    @IsString()
    doctor_id: string;
}

export class UpdatePatientDTO extends CreatePatientDTO {
/*     @IsOptional()
    medical_information?: Types.ObjectId;

    @IsOptional()
    billings?: Types.ObjectId[];

    @IsOptional()
    appointments?: Types.ObjectId[];

    @IsOptional()
    medical_histories?: Types.ObjectId[]; */
}