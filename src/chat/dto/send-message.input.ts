import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageInput {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  /** URLs returned by POST /api/upload/file. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
