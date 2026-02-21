import { ApiProperty } from '@nestjs/swagger';
import { ReadingStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateReadingStatusDto {
  @ApiProperty({ enum: ReadingStatus })
  @IsEnum(ReadingStatus)
  status!: ReadingStatus;
}
