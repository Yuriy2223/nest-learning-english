import { IsBoolean } from 'class-validator';

export class UpdateRuleStatusDto {
  @IsBoolean()
  isCompleted: boolean;
}
