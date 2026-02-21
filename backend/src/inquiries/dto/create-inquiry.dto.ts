import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryPriority, InquiryType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({ enum: InquiryType })
  @IsEnum(InquiryType)
  type!: InquiryType;

  @ApiProperty({ example: 'Payment receipt not recognized' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  subject!: string;

  @ApiProperty({
    example: 'I uploaded the payment slip but order is still pending.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    enum: InquiryPriority,
    default: InquiryPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;
}
