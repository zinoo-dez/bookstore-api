import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

export class AssignStaffRoleDto {
  @ApiProperty({ example: 'staff-role-uuid' })
  @IsUUID()
  roleId!: string;

  @ApiProperty({ required: false, example: '2026-02-12T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;

  @ApiProperty({ required: false, example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date;
}
