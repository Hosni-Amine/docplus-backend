import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  EOfficeAccessibility,
  EOfficePaymentMethod,
  EOfficeStatus,
} from '../../common';
import { CreateOfficeInput } from './create-office.input';

export class UpdateOfficeInput extends PartialType(CreateOfficeInput) {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsEnum(EOfficeStatus)
  status?: EOfficeStatus;

  @IsOptional()
  @IsObject()
  legalDetails?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsEnum(EOfficePaymentMethod, { each: true })
  paymentMethods?: EOfficePaymentMethod[];

  @IsOptional()
  @IsObject()
  fees?: Record<string, string>;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  refundMethods?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(EOfficeAccessibility, { each: true })
  accessibility?: EOfficeAccessibility[];
}
