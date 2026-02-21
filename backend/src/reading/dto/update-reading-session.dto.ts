import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateReadingSessionDto {
  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagesRead?: number;

  @ApiPropertyOptional({
    example: '2026-02-18T12:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @ApiPropertyOptional({ example: 'Updated after review' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  notes?: string;
}
