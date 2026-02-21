import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Delete,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Role } from '@prisma/client';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @Permissions('admin.role.promote')
  updateUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.usersService.updateUserRole(id, role);
  }

  @Get(':id/stats')
  getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      role?: Role;
    },
    @Request() req: { user: { sub: string; role?: string } },
  ) {
    return this.usersService.updateUser(id, body, {
      userId: req.user.sub,
      role: req.user.role,
    });
  }

  @Delete(':id')
  deleteUser(
    @Param('id') id: string,
    @Request() req: { user: { sub: string; role?: string } },
  ) {
    return this.usersService.deleteUser(id, {
      userId: req.user.sub,
      role: req.user.role,
    });
  }
}
