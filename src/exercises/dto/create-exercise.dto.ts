import { IsString, IsNotEmpty, IsEnum, IsArray, IsNumber, IsMongoId } from 'class-validator';

export class CreateExerciseDto {
  @IsEnum(['multiple_choice', 'fill_blank', 'translation'])
  @IsNotEmpty()
  type: 'multiple_choice' | 'fill_blank' | 'translation';

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsNumber()
  @IsNotEmpty()
  points: number;

  @IsMongoId()
  @IsNotEmpty()
  topicId: string;
}
