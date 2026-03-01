import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DeliveryType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({
    example: 'HOME_DELIVERY',
    enum: ['HOME_DELIVERY', 'STORE_PICKUP'],
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @ApiProperty({ example: 'store-uuid', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  storeId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+1 (555) 123-4567' })
  @IsString()
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsNotEmpty()
  @MaxLength(50)
  phone!: string;

  @ApiProperty({ example: '123 Main St, Apt 4B' })
  @IsString()
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsNotEmpty()
  @MaxLength(220)
  address!: string;

  @ApiProperty({ example: 'Seattle' })
  @IsString()
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsNotEmpty()
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 'WA' })
  @IsString()
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsNotEmpty()
  @MaxLength(120)
  state!: string;

  @ApiProperty({ example: '98101' })
  @IsString()
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsNotEmpty()
  @MaxLength(20)
  zipCode!: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType !== 'STORE_PICKUP')
  @IsNotEmpty()
  @MaxLength(120)
  country!: string;

  @ApiProperty({ example: 'KPAY', enum: ['KPAY', 'WAVEPAY', 'MPU', 'VISA'] })
  @IsString()
  @IsIn(['KPAY', 'WAVEPAY', 'MPU', 'VISA'])
  paymentProvider!: 'KPAY' | 'WAVEPAY' | 'MPU' | 'VISA';

  @ApiProperty({ example: '/uploads/payment-receipts/abc123.png' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  paymentReceiptUrl!: string;

  @ApiProperty({ example: 'BOOKLOVER10', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  promoCode?: string;
}
