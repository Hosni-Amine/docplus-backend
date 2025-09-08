import { ERole, PaginatorInfo } from '@app/common';
import { User } from '@src/schemas';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class GetUsersInput {
  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsString()
  role?: ERole;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;
}

export interface GetUsersPaginator {
  data: User[];
  paginatorInfo: PaginatorInfo;
}
