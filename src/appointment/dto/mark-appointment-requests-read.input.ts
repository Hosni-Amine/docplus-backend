import { IsArray, IsMongoId, IsOptional } from 'class-validator';

export class MarkAppointmentRequestsReadInput {
  /** When omitted, every pending request in the office is marked seen. */
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  ids?: string[];
}
