import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';

export class UpdateGrammarTopicDto {
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
}
