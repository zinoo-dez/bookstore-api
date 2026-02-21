import { ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryPriority, InquiryStatus, InquiryType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListInquiriesDto {
  @ApiPropertyOptional({ enum: InquiryStatus })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiPropertyOptional({ enum: InquiryType })
  @IsOptional()
  @IsEnum(InquiryType)
  type?: InquiryType;

  @ApiPropertyOptional({ enum: InquiryPriority })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;

  @ApiPropertyOptional({ description: 'Subject search' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
