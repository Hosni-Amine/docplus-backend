import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { EOfficeType, Office } from '../entities/office.entity';
import { PaginatorInfo } from '../../common/responses.dto';

export class GetOfficesInput {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(EOfficeType)
  type?: EOfficeType;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;
}

export interface GetOfficesPaginator {
  data: Office[];
  paginatorInfo: PaginatorInfo;
}
