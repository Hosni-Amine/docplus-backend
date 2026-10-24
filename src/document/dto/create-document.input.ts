import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDocumentInput {
  @IsMongoId()
  @IsNotEmpty()
  folderId: string;

  /** Free text chosen by the office (exam, visit, prescription...). */
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  /** URLs returned by POST /api/upload/file. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];
}
