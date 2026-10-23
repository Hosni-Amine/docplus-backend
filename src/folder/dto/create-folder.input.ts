import {
  IsArray,
  IsBoolean,
  IsDateString,
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

  @IsDateString()
  @IsNotEmpty()
  date: string;

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

  /** URLs returned by POST /api/upload/file. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];

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
