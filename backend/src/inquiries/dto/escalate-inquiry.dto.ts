import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EscalateInquiryDto {
  @ApiProperty({ description: 'Target department id' })
  @IsString()
  @IsNotEmpty()
  toDepartmentId!: string;
}
