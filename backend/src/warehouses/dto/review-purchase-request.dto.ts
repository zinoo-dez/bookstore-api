import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum PurchaseReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewPurchaseRequestDto {
  @ApiProperty({
    enum: PurchaseReviewAction,
    example: PurchaseReviewAction.APPROVE,
  })
  @IsEnum(PurchaseReviewAction)
  action!: PurchaseReviewAction;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  approvedQuantity?: number;

  @ApiPropertyOptional({ example: 100.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedCost?: number;

  @ApiPropertyOptional({ example: 'Approved with budget adjustment.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
