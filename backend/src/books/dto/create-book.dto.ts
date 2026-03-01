import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsArray,
  ArrayMinSize,
  ArrayUnique,
  IsBoolean,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BOOK_CATEGORIES, BOOK_GENRES } from '../constants/book-taxonomy';

export class CreateBookDto {
  @ApiProperty({
    description: 'Book title',
    example: 'The Great Gatsby',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Book categories',
    example: ['Fiction', 'Mystery'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(BOOK_CATEGORIES, { each: true })
  @IsString({ each: true })
  categories!: string[];

  @ApiPropertyOptional({
    description: 'Book genres',
    example: ['Thriller', 'Adventure'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(BOOK_GENRES, { each: true })
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

  @ApiPropertyOptional({
    description: 'eBook price (if sold digitally). Defaults to physical price if omitted.',
    example: 9.99,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  ebookPrice?: number;

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

  @ApiPropertyOptional({
    description: 'Whether this listing is a digital eBook',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @ApiPropertyOptional({
    description: 'Digital format for eBooks',
    enum: ['EPUB', 'PDF'],
    example: 'EPUB',
  })
  @ValidateIf((obj) => obj.isDigital === true)
  @IsIn(['EPUB', 'PDF'])
  ebookFormat?: 'EPUB' | 'PDF';

  @ApiPropertyOptional({
    description: 'Relative file path under uploads/ebooks (e.g., my-book.epub)',
    example: 'my-book.epub',
  })
  @ValidateIf((obj) => obj.isDigital === true)
  @IsString()
  ebookFilePath?: string;

  @ApiPropertyOptional({
    description: 'Total pages used for digital reader progress tracking',
    example: 240,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalPages?: number;
}
