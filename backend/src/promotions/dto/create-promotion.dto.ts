import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PromotionDiscountType } from '@prisma/client';

export class CreatePromotionDto {
  @ApiProperty({ example: 'BOOKLOVER10' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: '10% off orders over $30' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Seasonal loyalty campaign.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @ApiProperty({ enum: PromotionDiscountType, example: PromotionDiscountType.PERCENT })
  @IsEnum(PromotionDiscountType)
  discountType!: PromotionDiscountType;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  discountValue!: number;

  @ApiPropertyOptional({ example: 30, default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minSubtotal?: number;

  @ApiPropertyOptional({ example: 25 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-04-15T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ example: 500 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
