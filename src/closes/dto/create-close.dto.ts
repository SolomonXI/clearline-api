import { IsString, IsDateString, IsInt, Min, Max, MinLength } from 'class-validator';

export class CreateCloseDto {
  @IsString()
  @MinLength(2)
  period: string;

  @IsString()
  @MinLength(2)
  entity: string;

  @IsDateString()
  startDate: string;

  @IsInt()
  @Min(1)
  @Max(30)
  targetDays: number;
}
