import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStaffAccountAccessDto {
  @IsEnum(Role)
  role!: Role;
}

