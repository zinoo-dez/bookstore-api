import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateReadingProgressDto {
  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(0)
  currentPage!: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;
}
