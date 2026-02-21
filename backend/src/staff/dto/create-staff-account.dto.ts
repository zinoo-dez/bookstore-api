import { ApiProperty } from '@nestjs/swagger';
import { StaffStatus } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateStaffAccountDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name!: string;

  @ApiProperty({ example: 'jane.smith@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'department-uuid' })
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ required: false, example: 'EMP-0001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  employeeCode?: string;

  @ApiProperty({ example: 'HR Coordinator' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title!: string;

  @ApiProperty({ required: false, example: 'manager-staff-profile-uuid' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiProperty({
    required: false,
    enum: StaffStatus,
    example: StaffStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiProperty({ required: false, type: [String], example: ['role-uuid-1'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds?: string[];

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  sendActivationEmail?: boolean;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  convertExisting?: boolean;
}
