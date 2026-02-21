import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePurchaseRequestDto {
  @ApiProperty({ example: 'book-uuid' })
  @IsUUID()
  bookId!: string;

  @ApiProperty({ example: 'warehouse-uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 129.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ example: 'Stock below threshold for the last week.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reviewNote?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  submitForApproval?: boolean;
}
