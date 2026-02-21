import { ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListInquiryTemplatesDto {
  @ApiPropertyOptional({ enum: InquiryType })
  @IsOptional()
  @IsEnum(InquiryType)
  type?: InquiryType;
}
