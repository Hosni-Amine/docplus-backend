import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EOfficeStatus } from '../../common';
import { CreateOfficeInput } from './create-office.input';

export class UpdateOfficeInput extends PartialType(CreateOfficeInput) {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsEnum(EOfficeStatus)
  status?: EOfficeStatus;
}
