import { PartialType } from '@nestjs/swagger';
import { CreateStaffTaskDto } from './create-staff-task.dto';

export class UpdateStaffTaskDto extends PartialType(CreateStaffTaskDto) {}
