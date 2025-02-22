import { ERole, PaginatorInfo } from '@app/common';
import { User } from '@src/user/schemas/user.schema';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { Multer } from 'multer';

export class CreateUserDTO {

    @IsOptional()
    photo?: Multer.File;
    
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    fullname?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => new Types.ObjectId(value))
    doctor?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsNotEmpty()
    @IsString()
    role?: ERole;
}

export class UpdateUserDTO extends CreateUserDTO {
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => new Types.ObjectId(value))
    id: string;
}

export interface GetUsersResDTO {
    data: User[];
    paginatorInfo: PaginatorInfo
  }

