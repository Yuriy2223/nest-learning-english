import { IsBoolean } from 'class-validator';

export class UpdateWordStatusDto {
  @IsBoolean()
  isKnown: boolean;
}
