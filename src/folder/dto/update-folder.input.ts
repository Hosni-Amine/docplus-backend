import { PartialType } from '@nestjs/mapped-types';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { CreateFolderInput } from './create-folder.input';

export class UpdateFolderInput extends PartialType(CreateFolderInput) {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}
