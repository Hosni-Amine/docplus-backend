import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateOfficeInput } from './create-office.input';

export class UpdateOfficeInput extends PartialType(CreateOfficeInput) {
  @IsString()
  @IsNotEmpty()
  id: string;
}
