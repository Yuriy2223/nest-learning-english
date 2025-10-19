import { IsString, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class UpdateGrammarRuleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  examples?: string[];

  @IsMongoId()
  @IsOptional()
  topicId?: string;
}
