import { IsString, IsOptional, IsUrl, IsMongoId } from 'class-validator';

export class UpdateWordDto {
  @IsString()
  @IsOptional()
  word?: string;

  @IsString()
  @IsOptional()
  translation?: string;

  @IsString()
  @IsOptional()
  transcription?: string;

  @IsUrl()
  @IsOptional()
  audioUrl?: string;

  @IsMongoId()
  @IsOptional()
  topicId?: string;
}
