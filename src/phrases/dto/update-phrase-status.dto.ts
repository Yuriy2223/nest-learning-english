import { IsBoolean } from 'class-validator';

export class UpdatePhraseStatusDto {
  @IsBoolean()
  isKnown: boolean;
}
