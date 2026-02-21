import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({
    description: 'Book title',
    example: 'The Great Gatsby',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Book categories/genres',
    example: ['Fiction', 'Mystery'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Book genres',
    example: ['Thriller', 'Adventure'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiProperty({
    description: 'Book author',
    example: 'F. Scott Fitzgerald',
  })
  @IsString()
  @IsNotEmpty()
  author!: string;

  @ApiProperty({
    description: 'Book ISBN',
    example: '978-0-7432-7356-5',
  })
  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @ApiProperty({
    description: 'Book price',
    example: 19.99,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({
    description: 'Book stock quantity',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({
    description: 'Book description',
    example: 'A classic American novel set in the Jazz Age',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Book cover image URL',
    example: 'https://example.com/covers/great-gatsby.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
