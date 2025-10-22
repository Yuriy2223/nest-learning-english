import { IsString, IsEnum, IsOptional, IsUrl, IsNumber } from 'class-validator';

export class UpdateTopicExerciseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsNumber()
  @IsOptional()
  totalScore?: number;
}
