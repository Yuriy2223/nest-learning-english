import { IsNumber, Min } from 'class-validator';

export class UpdateStudyTimeDto {
  @IsNumber()
  @Min(0)
  seconds: number;
}
