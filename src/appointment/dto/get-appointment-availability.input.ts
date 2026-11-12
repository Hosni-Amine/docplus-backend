import { IsMongoId, IsOptional, IsString, Matches } from 'class-validator';

export class GetAppointmentAvailabilityInput {
  @IsMongoId()
  adminId: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;

  @IsOptional()
  @IsMongoId()
  excludeAppointmentId?: string;
}
