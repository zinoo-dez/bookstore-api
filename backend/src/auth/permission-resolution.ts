import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  PERMISSION_CATALOG,
  RESTRICTED_SYSTEM_PERMISSIONS,
} from './access-control.policy';

export async function resolveUserPermissionKeys(
  prisma: PrismaService,
  userId: string,
): Promise<Set<string>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return new Set();
  }

  if (String(user.role) === 'SUPER_ADMIN') {
    return new Set(['*']);
  }

  if (user.role === 'ADMIN') {
    const adminPermissions = PERMISSION_CATALOG
      .map((permission) => permission.key)
      .filter((key) => !RESTRICTED_SYSTEM_PERMISSIONS.has(key));
    return new Set(adminPermissions);
  }

  const keys = new Set<string>(['inquiries.create', 'inquiries.view']);

  const now = new Date();
  const staffProfile = await prisma.staffProfile.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      assignments: {
        where: {
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!staffProfile) {
    return keys;
  }

  for (const assignment of staffProfile.assignments) {
    for (const link of assignment.role.permissions) {
      keys.add(link.permission.key);
    }
  }

  return keys;
}

export function hasRequiredPermissions(
  userPermissionKeys: Set<string>,
  requiredPermissions: string[],
): boolean {
  if (userPermissionKeys.has('*')) {
    return true;
  }

  return requiredPermissions.every((permission) =>
    userPermissionKeys.has(permission),
  );
}

export async function assertUserPermission(
  prisma: PrismaService,
  userId: string,
  permissionKey: string,
): Promise<void> {
  const keys = await resolveUserPermissionKeys(prisma, userId);
  if (!hasRequiredPermissions(keys, [permissionKey])) {
    throw new ForbiddenException(
      `Missing required permission: ${permissionKey}`,
    );
  }
}

export interface PermissionRequestUser {
  sub: string;
  email?: string;
  role?: string;
  permissions?: string[];
}

export interface PermissionRequest {
  user?: PermissionRequestUser;
}
