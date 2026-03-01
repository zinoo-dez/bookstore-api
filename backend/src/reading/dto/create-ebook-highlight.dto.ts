import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEbookHighlightDto {
  @ApiPropertyOptional({ example: 44, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 'epubcfi(/6/14[xchapter]!/4/2/2,/1:0,/1:42)' })
  @IsString()
  startCfi!: string;

  @ApiPropertyOptional({ example: 'epubcfi(/6/14[xchapter]!/4/2/2,/1:42,/1:84)' })
  @IsOptional()
  @IsString()
  endCfi?: string;

  @ApiPropertyOptional({ example: 'Highlighted snippet text' })
  @IsOptional()
  @IsString()
  textSnippet?: string;

  @ApiPropertyOptional({ example: 'yellow' })
  @IsOptional()
  @IsString()
  color?: string;
}
