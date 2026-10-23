import { IsArray, IsEmail, IsMongoId, IsNotEmpty } from 'class-validator';

export class FolderSharedInput {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  /** Emails the folder is shared with. */
  @IsArray()
  @IsEmail({}, { each: true, message: 'INVALID_EMAIL' })
  shared: string[];
}
