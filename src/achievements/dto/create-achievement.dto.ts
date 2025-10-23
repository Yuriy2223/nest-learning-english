import { IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateAchievementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsEnum(['bronze', 'silver', 'gold', 'diamond'])
  @IsNotEmpty()
  type: 'bronze' | 'silver' | 'gold' | 'diamond';

  @IsEnum(['words', 'phrases', 'exercises', 'grammar', 'streak', 'points'])
  @IsNotEmpty()
  category: 'words' | 'phrases' | 'exercises' | 'grammar' | 'streak' | 'points';

  @IsNumber()
  @IsNotEmpty()
  target: number;

  @IsNumber()
  @IsNotEmpty()
  points: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
