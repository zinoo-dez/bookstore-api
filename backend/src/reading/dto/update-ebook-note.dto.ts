import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEbookNoteDto {
  @ApiPropertyOptional({ example: 33, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 'epubcfi(/6/14[xchapter]!/4/2/2)' })
  @IsOptional()
  @IsString()
  locationCfi?: string;

  @ApiPropertyOptional({ example: 'Updated note text' })
  @IsOptional()
  @IsString()
  content?: string;
}
