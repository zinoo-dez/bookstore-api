import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateReadingGoalDto {
  @ApiPropertyOptional({
    example: 20,
    description: 'Set null or omit to clear goal',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dailyGoalPages?: number;
}
