import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFolderInput {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Patient or office staff. */
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  /** Visit this folder belongs to. */
  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  /** Emails the folder is shared with. */
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true, message: 'INVALID_EMAIL' })
  shared?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isFavorited?: boolean;
}
