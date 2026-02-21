import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class TransferStockDto {
  @ApiProperty({ example: 'book-uuid' })
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @ApiProperty({ example: 'warehouse-from-uuid' })
  @IsString()
  @IsNotEmpty()
  fromWarehouseId!: string;

  @ApiProperty({ example: 'warehouse-to-uuid' })
  @IsString()
  @IsNotEmpty()
  toWarehouseId!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    example: 'Rebalancing stock for promotion',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
