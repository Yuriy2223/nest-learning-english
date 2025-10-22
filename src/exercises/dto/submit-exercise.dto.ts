import { IsString, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';

export class SubmitExerciseDto {
  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsNumber()
  earnedPoints: number;
}
