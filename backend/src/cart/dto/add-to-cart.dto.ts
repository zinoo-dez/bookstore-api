import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookPurchaseFormat } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'Book ID to add to cart',
    example: 'clm1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @ApiProperty({
    description: 'Quantity of books to add',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Purchase format for the cart item',
    enum: BookPurchaseFormat,
    required: false,
    default: BookPurchaseFormat.PHYSICAL,
  })
  @IsOptional()
  @IsEnum(BookPurchaseFormat)
  format?: BookPurchaseFormat;
}
