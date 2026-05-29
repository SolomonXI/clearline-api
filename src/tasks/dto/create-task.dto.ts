import { IsString, IsEnum, IsInt, Min, Max, IsOptional, MinLength } from 'class-validator';
import { TaskSection } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(TaskSection)
  section: TaskSection;

  @IsInt()
  @Min(1)
  @Max(30)
  dueDay: number;

  @IsOptional()
  @IsString()
  ownerId?: string;
}
