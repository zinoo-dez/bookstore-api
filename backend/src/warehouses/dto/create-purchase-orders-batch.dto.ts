import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseOrdersBatchDto {
  @ApiProperty({
    type: [String],
    example: ['request-uuid-1', 'request-uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  purchaseRequestIds!: string[];

  @ApiProperty({ example: 'vendor-uuid' })
  @IsUUID()
  vendorId!: string;

  @ApiPropertyOptional({ example: 14.95 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitCost?: number;

  @ApiPropertyOptional({ example: '2026-03-01T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @ApiPropertyOptional({ example: 'Batch conversion from approved requests.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
