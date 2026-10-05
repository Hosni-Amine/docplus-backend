import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserInput } from './create-user.input';

export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['officeId'] as const),
) {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
