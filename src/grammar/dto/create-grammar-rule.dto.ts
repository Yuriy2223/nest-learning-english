import { IsString, IsNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class CreateGrammarRuleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  examples: string[];

  @IsMongoId()
  @IsNotEmpty()
  topicId: string;
}
