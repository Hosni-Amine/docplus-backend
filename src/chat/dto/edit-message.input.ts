import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EditMessageInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}
