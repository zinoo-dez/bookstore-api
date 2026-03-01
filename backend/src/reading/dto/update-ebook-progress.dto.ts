import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateEbookProgressDto {
  @ApiPropertyOptional({ example: 12, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 'epubcfi(/6/14[xchapter]!/4/2/2)' })
  @IsOptional()
  @IsString()
  locationCfi?: string;

  @ApiPropertyOptional({ example: 22.5, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent?: number;
}
