import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { CloseStatus } from '@prisma/client';

export class UpdateCloseDto {
  @IsOptional()
  @IsEnum(CloseStatus)
  status?: CloseStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  targetDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  currentDay?: number;
}
