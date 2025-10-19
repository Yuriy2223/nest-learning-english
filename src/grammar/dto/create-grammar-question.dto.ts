import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsMongoId,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateGrammarQuestionDto {
  @IsMongoId()
  @IsNotEmpty()
  topicId: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctAnswer: number;

  @IsString()
  @IsOptional()
  explanation?: string;
}
