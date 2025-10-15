import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl } from 'class-validator';

export class CreateTopicDto {
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
}
