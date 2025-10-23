import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAchievementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsEnum(['bronze', 'silver', 'gold', 'diamond'])
  @IsOptional()
  type?: 'bronze' | 'silver' | 'gold' | 'diamond';

  @IsEnum(['words', 'phrases', 'exercises', 'grammar', 'streak', 'points'])
  @IsOptional()
  category?: 'words' | 'phrases' | 'exercises' | 'grammar' | 'streak' | 'points';

  @IsNumber()
  @IsOptional()
  target?: number;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
