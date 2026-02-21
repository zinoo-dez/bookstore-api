import { Module } from '@nestjs/common';
import {
  DepartmentsAdminController,
  StaffAdminController,
} from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  controllers: [DepartmentsAdminController, StaffAdminController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
