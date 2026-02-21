import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'purchase-request-uuid' })
  @IsUUID()
  purchaseRequestId!: string;

  @ApiProperty({ example: 'vendor-uuid' })
  @IsUUID()
  vendorId!: string;

  @ApiProperty({ required: false, example: 14.95 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitCost?: number;

  @ApiProperty({ required: false, example: '2026-03-01T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @ApiProperty({
    required: false,
    example: 'Urgent replenishment for weekend demand.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
