import { IsString, IsNotEmpty, IsOptional, IsUrl, IsMongoId } from 'class-validator';

export class CreatePhraseDto {
  @IsString()
  @IsNotEmpty()
  phrase: string;

  @IsString()
  @IsNotEmpty()
  translation: string;

  @IsUrl()
  @IsOptional()
  audioUrl?: string;

  @IsMongoId()
  @IsNotEmpty()
  topicId: string;
}
