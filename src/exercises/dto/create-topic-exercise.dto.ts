import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl, IsNumber } from 'class-validator';

export class CreateTopicExerciseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @IsNotEmpty()
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @IsNumber()
  @IsOptional()
  totalScore?: number;
}
