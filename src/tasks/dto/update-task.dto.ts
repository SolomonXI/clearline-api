import { IsEnum, IsInt, IsOptional, IsString, Min, Max, MinLength } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  ownerId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  dueDay?: number;
}
