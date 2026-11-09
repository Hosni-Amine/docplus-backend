import { IsEnum, IsNotEmpty } from 'class-validator';
import { EDemoRequestStatus } from '../../common';

export class UpdateDemoRequestStatusInput {
  @IsEnum(EDemoRequestStatus)
  @IsNotEmpty()
  status: EDemoRequestStatus;
}
