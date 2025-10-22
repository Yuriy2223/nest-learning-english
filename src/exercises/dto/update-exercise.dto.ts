import { IsString, IsEnum, IsArray, IsNumber, IsMongoId, IsOptional } from 'class-validator';

export class UpdateExerciseDto {
  @IsEnum(['multiple_choice', 'fill_blank', 'translation'])
  @IsOptional()
  type?: 'multiple_choice' | 'fill_blank' | 'translation';

  @IsString()
  @IsOptional()
  question?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsMongoId()
  @IsOptional()
  topicId?: string;
}
