import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ example: 'PENGUIN-RH' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Penguin Random House Distribution' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ required: false, example: 'B2B Team' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiProperty({ required: false, example: 'supply@vendor.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '+1-415-555-0142' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({
    required: false,
    example: '120 Distribution Lane, Newark, NJ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
