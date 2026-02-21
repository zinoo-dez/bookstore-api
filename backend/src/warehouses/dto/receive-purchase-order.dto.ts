import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class ReceivePurchaseOrderItemDto {
  @ApiProperty({ example: 'purchase-order-item-uuid' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  receivedQuantity!: number;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({
    required: false,
    type: [ReceivePurchaseOrderItemDto],
    description:
      'Optional partial receive payload. If omitted, receives all remaining quantities.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items?: ReceivePurchaseOrderItemDto[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  closeWhenFullyReceived?: boolean;

  @ApiProperty({
    required: false,
    example: 'Received from vendor truck #8821.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
