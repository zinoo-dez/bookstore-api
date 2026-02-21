import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+1 (555) 123-4567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone!: string;

  @ApiProperty({ example: '123 Main St, Apt 4B' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  address!: string;

  @ApiProperty({ example: 'Seattle' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 'WA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  state!: string;

  @ApiProperty({ example: '98101' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  zipCode!: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
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
