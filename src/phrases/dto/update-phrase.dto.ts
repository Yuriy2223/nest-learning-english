import { IsString, IsOptional, IsUrl, IsMongoId } from 'class-validator';

export class UpdatePhraseDto {
  @IsString()
  @IsOptional()
  phrase?: string;

  @IsString()
  @IsOptional()
  translation?: string;

  @IsUrl()
  @IsOptional()
  audioUrl?: string;

  @IsMongoId()
  @IsOptional()
  topicId?: string;
}
