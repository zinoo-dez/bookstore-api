import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddInquiryMessageDto {
  @ApiProperty({ example: 'Thanks, can you share the receipt reference code?' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
