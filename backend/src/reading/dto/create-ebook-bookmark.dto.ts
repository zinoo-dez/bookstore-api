import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEbookBookmarkDto {
  @ApiProperty({ example: 18, minimum: 1 })
  @IsNumber()
  @Min(1)
  page!: number;

  @ApiPropertyOptional({ example: 'epubcfi(/6/14[xchapter]!/4/2/2)' })
  @IsOptional()
  @IsString()
  locationCfi?: string;

  @ApiPropertyOptional({ example: 'Important section' })
  @IsOptional()
  @IsString()
  label?: string;
}
