import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EDemoRequestStatus } from '../../common';

export class GetDemoRequestsInput {
  @IsEnum(EDemoRequestStatus)
  @IsOptional()
  status?: EDemoRequestStatus;

  @IsString()
  @IsOptional()
  search?: string;
}
