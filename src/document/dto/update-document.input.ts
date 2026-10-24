import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { CreateDocumentInput } from './create-document.input';

export class UpdateDocumentInput extends PartialType(
  OmitType(CreateDocumentInput, ['folderId'] as const),
) {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}
