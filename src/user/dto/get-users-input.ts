import { ERole, EUserStatus, PaginatorInfo } from '../../common';
import { User } from '../entities/user.entity';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export class GetUsersInput {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: ERole;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;

  @IsOptional()
  @IsEnum(EUserStatus)
  status?: EUserStatus;
}

export interface GetUsersPaginator {
  data: User[];
  paginatorInfo: PaginatorInfo;
}
