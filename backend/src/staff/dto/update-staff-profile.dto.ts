import { PartialType } from '@nestjs/swagger';
import { CreateStaffProfileDto } from './create-staff-profile.dto';

export class UpdateStaffProfileDto extends PartialType(CreateStaffProfileDto) {}
