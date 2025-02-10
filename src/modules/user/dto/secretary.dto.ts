import { IsString, IsOptional } from 'class-validator';
import { CreateUserDTO } from './user.dto';

//http://localhost:4000/api/user/secretary

export class CreateSecretaryDTO extends CreateUserDTO {
    @IsOptional()
    @IsString()
    doctor_id: string;
}

export class UpdateSecretaryDTO extends CreateSecretaryDTO {
    /* @IsOptional()
    medical_information?: Types.ObjectId;

    @IsOptional()
    billings?: Types.ObjectId[];

    @IsOptional()
    appointments?: Types.ObjectId[];

    @IsOptional()
    medical_histories?: Types.ObjectId[]; */
}