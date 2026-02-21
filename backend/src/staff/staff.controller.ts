import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  StaffStatus,
  StaffTaskPriority,
  StaffTaskStatus,
} from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpsertRolePermissionsDto } from './dto/upsert-role-permissions.dto';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { AssignStaffRoleDto } from './dto/assign-staff-role.dto';
import { CreateStaffTaskDto } from './dto/create-staff-task.dto';
import { UpdateStaffTaskDto } from './dto/update-staff-task.dto';
import { HireExistingUserDto } from './dto/hire-existing-user.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { StaffService } from './staff.service';

type AuthenticatedRequest = {
  user: {
    sub: string;
  };
};

@ApiTags('admin-departments')
@Controller('admin/departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class DepartmentsAdminController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Permissions('staff.view')
  @ApiOperation({ summary: 'List departments' })
  listDepartments() {
    return this.staffService.listDepartments();
  }

  @Post()
  @Permissions('staff.manage')
  @ApiOperation({ summary: 'Create department' })
  createDepartment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.staffService.createDepartment(dto, req.user.sub);
  }

  @Patch(':id')
  @Permissions('staff.manage')
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.staffService.updateDepartment(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Permissions('staff.manage')
  @ApiOperation({ summary: 'Delete department' })
  deleteDepartment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.staffService.deleteDepartment(id, req.user.sub);
  }
}

@ApiTags('admin-staff')
@Controller('admin/staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class StaffAdminController {
  constructor(private readonly staffService: StaffService) {}

  @Get('permissions')
  @Permissions('staff.view')
  @ApiOperation({ summary: 'List known permission keys' })
  listPermissions() {
    return this.staffService.listPermissions();
  }

  @Get('roles')
  @Permissions('staff.view')
  @ApiOperation({ summary: 'List staff roles' })
  listRoles(@Query('departmentId') departmentId?: string) {
    return this.staffService.listRoles(departmentId);
  }

  @Post('roles')
  @Permissions('staff.manage', 'admin.permission.manage')
  @ApiOperation({ summary: 'Create staff role' })
  createRole(@Req() req: AuthenticatedRequest, @Body() dto: CreateRoleDto) {
    return this.staffService.createRole(dto, req.user.sub);
  }

  @Patch('roles/:id')
  @Permissions('staff.manage', 'admin.permission.manage')
  @ApiOperation({ summary: 'Update staff role' })
  updateRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.staffService.updateRole(id, dto, req.user.sub);
  }

  @Delete('roles/:id')
  @Permissions('staff.manage', 'admin.permission.manage')
  @ApiOperation({ summary: 'Delete staff role' })
  deleteRole(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.staffService.deleteRole(id, req.user.sub);
  }

  @Post('roles/:id/permissions')
  @Permissions('staff.manage', 'admin.permission.manage')
  @ApiOperation({ summary: 'Replace role permissions' })
  upsertRolePermissions(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpsertRolePermissionsDto,
  ) {
    return this.staffService.upsertRolePermissions(id, dto, req.user.sub);
  }

  @Post()
  @Permissions('hr.staff.create')
  @ApiOperation({ summary: 'Create a staff profile' })
  createStaffProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStaffProfileDto,
  ) {
    return this.staffService.createStaffProfile(dto, req.user.sub);
  }

  @Get('candidates')
  @Permissions('hr.staff.create')
  @ApiOperation({ summary: 'List users eligible for staff profile creation' })
  listStaffCandidates(@Query('q') query?: string) {
    return this.staffService.listStaffCandidates(query);
  }

  @Post('hire-existing')
  @Permissions('hr.staff.create')
  @ApiOperation({ summary: 'Hire an existing user into staff' })
  hireExistingUser(
    @Req() req: AuthenticatedRequest,
    @Body() dto: HireExistingUserDto,
  ) {
    return this.staffService.hireExistingUser(dto, req.user.sub);
  }

  @Post('create-account')
  @Permissions('hr.staff.create')
  @ApiOperation({ summary: 'Create a new account and hire as staff' })
  createStaffAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStaffAccountDto,
  ) {
    return this.staffService.createStaffAccount(dto, req.user.sub);
  }

  @Get()
  @Permissions('staff.view')
  @ApiOperation({ summary: 'List staff profiles' })
  listStaffProfiles(
    @Req() req: AuthenticatedRequest,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: StaffStatus,
    @Query('roleId') roleId?: string,
  ) {
    return this.staffService.listStaffProfiles(
      {
        departmentId,
        status,
        roleId,
      },
      req.user.sub,
    );
  }

  @Get('tasks')
  @Permissions('staff.view')
  @ApiOperation({ summary: 'List staff tasks' })
  listTasks(
    @Req() req: AuthenticatedRequest,
    @Query('departmentId') departmentId?: string,
    @Query('staffId') staffId?: string,
    @Query('status') status?: StaffTaskStatus,
    @Query('priority') priority?: StaffTaskPriority,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.staffService.listTasks(
      {
        departmentId,
        staffId,
        status,
        priority,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Post('tasks')
  @Permissions('hr.performance.manage')
  @ApiOperation({ summary: 'Create staff task' })
  createTask(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStaffTaskDto,
  ) {
    return this.staffService.createTask(dto, req.user.sub);
  }

  @Patch('tasks/:id')
  @Permissions('hr.performance.manage')
  @ApiOperation({ summary: 'Update staff task' })
  updateTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffTaskDto,
  ) {
    return this.staffService.updateTask(id, dto, req.user.sub);
  }

  @Post('tasks/:id/complete')
  @Permissions('staff.view')
  @ApiOperation({ summary: 'Complete staff task' })
  completeTask(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.staffService.completeTask(id, req.user.sub);
  }

  @Get('performance')
  @Permissions('hr.performance.manage')
  @ApiOperation({ summary: 'Get staff performance metrics' })
  getPerformance(
    @Req() req: AuthenticatedRequest,
    @Query('departmentId') departmentId?: string,
    @Query('staffId') staffId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.staffService.getPerformanceMetrics(
      {
        departmentId,
        staffId,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Get(':id')
  @Permissions('staff.view')
  @ApiOperation({ summary: 'Get staff profile detail' })
  getStaffProfile(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.staffService.getStaffProfile(id, req.user.sub);
  }

  @Patch(':id')
  @Permissions('hr.staff.update')
  @ApiOperation({ summary: 'Update staff profile' })
  updateStaffProfile(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffProfileDto,
  ) {
    return this.staffService.updateStaffProfile(id, dto, req.user.sub);
  }

  @Post(':id/roles')
  @Permissions('hr.staff.update')
  @ApiOperation({ summary: 'Assign role to staff profile' })
  assignRoleToStaff(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AssignStaffRoleDto,
  ) {
    return this.staffService.assignRoleToStaff(id, dto, req.user.sub);
  }

  @Delete(':id/roles/:assignmentId')
  @Permissions('hr.staff.update')
  @ApiOperation({ summary: 'Remove staff assignment' })
  removeStaffAssignment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.staffService.removeStaffAssignment(
      id,
      assignmentId,
      req.user.sub,
    );
  }

  @Get(':id/audit')
  @Permissions('staff.view')
  @ApiOperation({ summary: 'List staff-specific audit logs' })
  listStaffAuditLogs(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.staffService.listStaffAuditLogs(id, parsedLimit, req.user.sub);
  }
}
