import { IsArray, IsInt, Min, Max } from 'class-validator';

export class SubmitTestDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(3, { each: true })
  answers: number[];
}
