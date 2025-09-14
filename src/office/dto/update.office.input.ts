import { IsNotEmpty, IsString } from 'class-validator';
import { CreateOfficeInput } from './create-office.input';
import { PartialType } from '@nestjs/swagger';

export class UpdateOfficeInput extends PartialType(CreateOfficeInput) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
