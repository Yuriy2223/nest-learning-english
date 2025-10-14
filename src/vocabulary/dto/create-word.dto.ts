import { IsString, IsNotEmpty, IsOptional, IsUrl, IsMongoId } from 'class-validator';

export class CreateWordDto {
  @IsString()
  @IsNotEmpty()
  word: string;

  @IsString()
  @IsNotEmpty()
  translation: string;

  @IsString()
  @IsNotEmpty()
  transcription: string;

  @IsUrl()
  @IsOptional()
  audioUrl?: string;

  @IsMongoId()
  @IsNotEmpty()
  topicId: string;
}
