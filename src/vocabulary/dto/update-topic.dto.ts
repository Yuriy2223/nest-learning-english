import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';

export class UpdateTopicDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(['vocabulary', 'phrases', 'grammar'])
  @IsOptional()
  type?: 'vocabulary' | 'phrases' | 'grammar';

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
