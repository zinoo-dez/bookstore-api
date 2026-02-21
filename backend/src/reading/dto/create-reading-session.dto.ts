import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateReadingSessionDto {
  @ApiProperty({ example: 18 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagesRead!: number;

  @ApiPropertyOptional({
    example: '2026-02-18T12:30:00.000Z',
    description: 'Defaults to now when omitted',
  })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @ApiPropertyOptional({ example: 'Strong chapter today' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  notes?: string;
}
