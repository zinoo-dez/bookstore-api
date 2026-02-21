import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import {
  hasRequiredPermissions,
  resolveUserPermissionKeys,
  type PermissionRequest,
} from './permission-resolution';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { type CanActivate, type ExecutionContext } from '@nestjs/common';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndMerge<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PermissionRequest>();
    const user = request.user;

    if (!user?.sub) {
      return false;
    }

    const permissionKeys = await resolveUserPermissionKeys(
      this.prisma,
      user.sub,
    );
    user.permissions = Array.from(permissionKeys);

    return hasRequiredPermissions(permissionKeys, requiredPermissions);
  }
}
