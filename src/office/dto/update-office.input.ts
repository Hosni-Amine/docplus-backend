import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import {
  EOfficeAccessibility,
  EOfficePaymentMethod,
  EOfficeStatus,
} from '../../common';
import { CreateOfficeInput } from './create-office.input';

@ValidatorConstraint({ name: 'stringRecordValues', async: false })
class StringRecordValuesConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((entry) => typeof entry === 'string')
    );
  }

  defaultMessage(): string {
    return 'Every value must be a string';
  }
}

export class UpdateOfficeInput extends PartialType(CreateOfficeInput) {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsEnum(EOfficeStatus)
  status?: EOfficeStatus;

  @IsOptional()
  @Validate(StringRecordValuesConstraint)
  legalDetails?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsEnum(EOfficePaymentMethod, { each: true })
  paymentMethods?: EOfficePaymentMethod[];

  @IsOptional()
  @Validate(StringRecordValuesConstraint)
  fees?: Record<string, string>;

  @IsOptional()
  @IsString()
  refunds?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsEnum(EOfficeAccessibility, { each: true })
  accessibility?: EOfficeAccessibility[];
}
