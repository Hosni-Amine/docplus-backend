import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateConversationInput {
  /** The other person. Same office, active admin. */
  @IsMongoId()
  @IsNotEmpty()
  participantId: string;
}
