import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignInquiryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  staffProfileId!: string;
}
