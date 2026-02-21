import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReadingStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CreateReadingItemDto {
  @ApiPropertyOptional({ enum: ReadingStatus, default: ReadingStatus.TO_READ })
  @IsOptional()
  @IsEnum(ReadingStatus)
  status?: ReadingStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentPage?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;

  @ApiPropertyOptional({
    example: 25,
    description: 'Target pages to read per day',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyGoalPages?: number;
}
