import { IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class ChangeOwnershipInput {
  @IsNotEmpty()
  @IsMongoId()
  id: string;

  @IsBoolean()
  isOwner: boolean;
}
