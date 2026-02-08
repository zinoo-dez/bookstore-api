import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body('role') role: Role,
  ) {
    return this.usersService.updateUserRole(id, role);
  }

  @Get(':id/stats')
  getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }
}
