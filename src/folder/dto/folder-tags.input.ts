import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class FolderTagsInput {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
