import { IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class FavoriteFolderInput {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  isFavorited: boolean;
}
