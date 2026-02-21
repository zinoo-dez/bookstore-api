import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryType } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const TEMPLATE_TYPE_VALUES = [...Object.values(InquiryType), 'COMMON'] as const;

export class CreateInquiryTemplateDto {
  @ApiProperty({ minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ enum: TEMPLATE_TYPE_VALUES })
  @IsOptional()
  @IsIn(TEMPLATE_TYPE_VALUES)
  type?: InquiryType | 'COMMON';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}
