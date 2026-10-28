import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { EContractStatus, EOfficePlan } from '../../common';

export class UpdateContractInput {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(EOfficePlan)
  plan?: EOfficePlan;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(EContractStatus)
  status?: EContractStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}
