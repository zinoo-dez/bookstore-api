import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Warehouse Supervisor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ required: false, example: 'department-uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'CS_SUPPORT_AGENT' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code must use only uppercase letters, numbers, and underscores',
  })
  code?: string;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
