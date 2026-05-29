import { IsString, MinLength, MaxLength } from 'class-validator';

export class GenerateInsightDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  context: string;
}
