import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { CreateUserInput } from './create-user.input';

export class UpdateUserInput extends CreateUserInput {
  @IsNotEmpty()
  @Transform(({ value }) => new Types.ObjectId(value))
  id: string;

  @IsOptional()
  @IsString()
  photo?: string;
}
