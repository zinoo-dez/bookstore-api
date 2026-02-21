import { ApiProperty } from '@nestjs/swagger';
import { StaffTaskPriority, StaffTaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateStaffTaskDto {
  @ApiProperty({ example: 'staff-profile-uuid' })
  @IsUUID()
  staffId!: string;

  @ApiProperty({ example: 'ticket-resolution' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  type!: string;

  @ApiProperty({
    required: false,
    enum: StaffTaskStatus,
    example: StaffTaskStatus.TODO,
  })
  @IsOptional()
  @IsEnum(StaffTaskStatus)
  status?: StaffTaskStatus;

  @ApiProperty({
    required: false,
    enum: StaffTaskPriority,
    example: StaffTaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(StaffTaskPriority)
  priority?: StaffTaskPriority;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({ required: false, example: '2026-02-12T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date;
}
