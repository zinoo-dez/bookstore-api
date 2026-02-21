import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBlogDto {
  @ApiProperty({ example: 'How to Build Resilient APIs with NestJS' })
  @IsString()
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({
    example: 'A practical architecture guide for real production constraints.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  subtitle?: string;

  @ApiProperty({ example: '# Intro\\nContent...' })
  @IsString()
  @MaxLength(50000)
  content!: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coverImage?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' })
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED';

  @ApiPropertyOptional({
    type: [String],
    example: ['backend', 'nestjs', 'architecture'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Book ids linked in this post',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  bookIds?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  readingTime?: number;
}
