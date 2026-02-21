import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  Role,
  StaffTaskStatus,
  type StaffStatus,
  type StaffTaskPriority,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
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

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private toRoleCodePart(value: string) {
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_{2,}/g, '_');
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateEmployeeCode() {
    const random = randomBytes(3).toString('hex').toUpperCase();
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `EMP-${date}-${random}`;
  }

  private generateTemporaryPassword() {
    return `Tmp!${randomBytes(6).toString('base64url')}`;
  }

  private async ensureUniqueRoleCode(baseCode: string, excludeRoleId?: string) {
    let candidate = baseCode;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.staffRole.findFirst({
        where: {
          code: candidate,
          ...(excludeRoleId ? { id: { not: excludeRoleId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseCode}_${suffix}`;
      suffix += 1;
    }
  }

  private async getActorContext(actorUserId?: string) {
    if (!actorUserId) {
      return {
        role: undefined as Role | undefined,
        staffProfileId: undefined as string | undefined,
        departmentId: undefined as string | undefined,
        departmentCode: undefined as string | undefined,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });

    if (!user) {
      return {
        role: undefined as Role | undefined,
        staffProfileId: undefined as string | undefined,
        departmentId: undefined as string | undefined,
        departmentCode: undefined as string | undefined,
      };
    }

    if (user.role === Role.ADMIN || String(user.role) === 'SUPER_ADMIN') {
      return {
        role: user.role,
        staffProfileId: undefined as string | undefined,
        departmentId: undefined as string | undefined,
        departmentCode: undefined as string | undefined,
      };
    }

    const profile = await this.prisma.staffProfile.findFirst({
      where: {
        userId: actorUserId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        departmentId: true,
        department: {
          select: {
            code: true,
          },
        },
      },
    });

    return {
      role: user.role,
      staffProfileId: profile?.id,
      departmentId: profile?.departmentId,
      departmentCode: profile?.department?.code,
    };
  }

  private async resolveScopedDepartmentId(
    actorUserId: string | undefined,
    requestedDepartmentId?: string,
    options?: { allowHrGlobalView?: boolean },
  ) {
    const actor = await this.getActorContext(actorUserId);

    if (actor.role === Role.ADMIN || String(actor.role) === 'SUPER_ADMIN') {
      return requestedDepartmentId;
    }

    if (options?.allowHrGlobalView && actor.departmentCode === 'HR') {
      return requestedDepartmentId;
    }

    if (!actor.departmentId) {
      throw new ForbiddenException(
        'Department-scoped access requires an active staff profile.',
      );
    }

    if (requestedDepartmentId && requestedDepartmentId !== actor.departmentId) {
      throw new ForbiddenException(
        'You can only access resources in your own department.',
      );
    }

    return actor.departmentId;
  }

  private async createAuditLog(
    actorUserId: string | undefined,
    action: string,
    resource: string,
    resourceId: string | undefined,
    changes?: Prisma.InputJsonValue,
  ) {
    return this.prisma.staffAuditLog.create({
      data: {
        actorUserId,
        action,
        resource,
        resourceId,
        changes,
      },
    });
  }

  async listDepartments() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            staffProfiles: true,
            staffRoles: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createDepartment(dto: CreateDepartmentDto, actorUserId?: string) {
    const department = await this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    await this.createAuditLog(
      actorUserId,
      'department.create',
      'department',
      department.id,
      department as unknown as Prisma.InputJsonValue,
    );

    return department;
  }

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
    actorUserId?: string,
  ) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.createAuditLog(
      actorUserId,
      'department.update',
      'department',
      id,
      {
        before: existing,
        after: department,
      } as unknown as Prisma.InputJsonValue,
    );

    return department;
  }

  async deleteDepartment(id: string, actorUserId?: string) {
    const linkedStaffCount = await this.prisma.staffProfile.count({
      where: { departmentId: id },
    });
    if (linkedStaffCount > 0) {
      throw new BadRequestException(
        'Cannot delete a department with linked staff profiles',
      );
    }

    const department = await this.prisma.department.delete({ where: { id } });
    await this.createAuditLog(
      actorUserId,
      'department.delete',
      'department',
      id,
      department as unknown as Prisma.InputJsonValue,
    );
    return department;
  }

  async listRoles(departmentId?: string) {
    return this.prisma.staffRole.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: true,
        permissions: {
          include: {
            permission: true,
          },
          orderBy: {
            permission: {
              key: 'asc',
            },
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async createRole(dto: CreateRoleDto, actorUserId?: string) {
    let departmentCode = 'GLOBAL';
    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
      departmentCode = this.toRoleCodePart(department.code);
    }

    const roleNameCode = this.toRoleCodePart(dto.name);
    const requestedCode = dto.code
      ? this.toRoleCodePart(dto.code)
      : `${departmentCode}_${roleNameCode}`;
    const uniqueCode = await this.ensureUniqueRoleCode(requestedCode);

    const role = await this.prisma.staffRole.create({
      data: {
        code: uniqueCode,
        name: dto.name,
        departmentId: dto.departmentId,
        isSystem: dto.isSystem ?? false,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.createAuditLog(
      actorUserId,
      'staffRole.create',
      'staffRole',
      role.id,
      role as unknown as Prisma.InputJsonValue,
    );

    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto, actorUserId?: string) {
    const existing = await this.prisma.staffRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    const nextCode = dto.code
      ? await this.ensureUniqueRoleCode(this.toRoleCodePart(dto.code), id)
      : undefined;

    const role = await this.prisma.staffRole.update({
      where: { id },
      data: {
        ...(nextCode !== undefined ? { code: nextCode } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.departmentId !== undefined
          ? { departmentId: dto.departmentId }
          : {}),
        ...(dto.isSystem !== undefined ? { isSystem: dto.isSystem } : {}),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.createAuditLog(
      actorUserId,
      'staffRole.update',
      'staffRole',
      id,
      {
        before: existing,
        after: role,
      } as unknown as Prisma.InputJsonValue,
    );

    return role;
  }

  async deleteRole(id: string, actorUserId?: string) {
    const existing = await this.prisma.staffRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    const activeAssignments = await this.prisma.staffAssignment.count({
      where: {
        roleId: id,
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'Cannot delete a role with active staff assignments',
      );
    }

    const role = await this.prisma.staffRole.delete({ where: { id } });

    await this.createAuditLog(
      actorUserId,
      'staffRole.delete',
      'staffRole',
      id,
      role as unknown as Prisma.InputJsonValue,
    );

    return role;
  }

  async listPermissions() {
    return this.prisma.staffPermission.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async upsertRolePermissions(
    roleId: string,
    dto: UpsertRolePermissionsDto,
    actorUserId?: string,
  ) {
    const role = await this.prisma.staffRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const uniqueKeys = Array.from(
      new Set(dto.permissionKeys.map((k) => k.trim())),
    ).filter((key) => key.length > 0);

    const permissions = await Promise.all(
      uniqueKeys.map((key) =>
        this.prisma.staffPermission.upsert({
          where: { key },
          update: {},
          create: { key },
        }),
      ),
    );

    await this.prisma.$transaction([
      this.prisma.staffRolePermission.deleteMany({ where: { roleId } }),
      ...permissions.map((permission) =>
        this.prisma.staffRolePermission.create({
          data: {
            roleId,
            permissionId: permission.id,
          },
        }),
      ),
    ]);

    const updatedRole = await this.prisma.staffRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
          orderBy: {
            permission: {
              key: 'asc',
            },
          },
        },
      },
    });

    await this.createAuditLog(
      actorUserId,
      'staffRole.permissions.replace',
      'staffRole',
      roleId,
      {
        permissionKeys: uniqueKeys,
      } as unknown as Prisma.InputJsonValue,
    );

    return updatedRole;
  }

  private async ensureDepartmentAndManager(
    tx: Prisma.TransactionClient,
    departmentId: string,
    managerId?: string,
  ) {
    const department = await tx.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (managerId) {
      const manager = await tx.staffProfile.findUnique({
        where: { id: managerId },
        select: { id: true },
      });
      if (!manager) {
        throw new NotFoundException('Manager profile not found');
      }
    }
  }

  private async ensureRoleIdsExist(
    tx: Prisma.TransactionClient,
    roleIds?: string[],
  ) {
    if (!roleIds || roleIds.length === 0) {
      return;
    }

    const existingRoles = await tx.staffRole.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });

    if (existingRoles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles were not found');
    }
  }

  private async createStaffProfileWithRoles(
    tx: Prisma.TransactionClient,
    payload: {
      userId: string;
      departmentId: string;
      employeeCode?: string;
      title: string;
      managerId?: string;
      status?: StaffStatus;
      roleIds?: string[];
    },
    actorUserId?: string,
  ) {
    const existingStaff = await tx.staffProfile.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });
    if (existingStaff) {
      throw new BadRequestException('User already has a staff profile');
    }

    const profile = await tx.staffProfile.create({
      data: {
        userId: payload.userId,
        departmentId: payload.departmentId,
        employeeCode:
          payload.employeeCode?.trim() || this.generateEmployeeCode(),
        title: payload.title,
        managerId: payload.managerId,
        status: payload.status ?? 'ACTIVE',
      },
      include: {
        user: true,
        department: true,
      },
    });

    if (payload.roleIds?.length) {
      await tx.staffAssignment.createMany({
        data: payload.roleIds.map((roleId) => ({
          staffId: profile.id,
          roleId,
        })),
      });
    }

    await this.createAuditLog(
      actorUserId,
      'staffProfile.create',
      'staffProfile',
      profile.id,
      {
        userId: payload.userId,
        departmentId: payload.departmentId,
        title: payload.title,
        roleIds: payload.roleIds ?? [],
      } as unknown as Prisma.InputJsonValue,
    );

    return profile;
  }

  async createStaffProfile(dto: CreateStaffProfileDto, actorUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureDepartmentAndManager(
        tx,
        dto.departmentId,
        dto.managerId,
      );
      return this.createStaffProfileWithRoles(tx, dto, actorUserId);
    });
  }

  async listStaffCandidates(query?: string) {
    const search = query?.trim();
    return this.prisma.user.findMany({
      where: {
        role: Role.USER,
        staffProfile: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 50,
      orderBy: [{ name: 'asc' }],
    });
  }

  async hireExistingUser(dto: HireExistingUserDto, actorUserId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, role: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.ensureDepartmentAndManager(
        tx,
        dto.departmentId,
        dto.managerId,
      );
      await this.ensureRoleIdsExist(tx, dto.roleIds);

      const profile = await this.createStaffProfileWithRoles(
        tx,
        dto,
        actorUserId,
      );
      return {
        mode: 'HIRED_EXISTING_USER',
        userId: dto.userId,
        profile,
      };
    });
  }

  async createStaffAccount(dto: CreateStaffAccountDto, actorUserId?: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureDepartmentAndManager(
        tx,
        dto.departmentId,
        dto.managerId,
      );
      await this.ensureRoleIdsExist(tx, dto.roleIds);

      const normalizedEmail = this.normalizeEmail(dto.email);
      const existingByEmail = await tx.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, name: true },
      });

      if (existingByEmail) {
        const existingStaff = await tx.staffProfile.findUnique({
          where: { userId: existingByEmail.id },
          select: { id: true },
        });

        if (existingStaff) {
          throw new BadRequestException(
            'This user already has a staff profile.',
          );
        }

        if (!dto.convertExisting) {
          throw new BadRequestException({
            code: 'EXISTING_USER_FOUND',
            message:
              'A user with this email already exists. Set convertExisting=true to hire this existing user.',
            existingUser: existingByEmail,
          });
        }

        const profile = await this.createStaffProfileWithRoles(
          tx,
          {
            userId: existingByEmail.id,
            departmentId: dto.departmentId,
            employeeCode: dto.employeeCode,
            title: dto.title,
            managerId: dto.managerId,
            status: dto.status,
            roleIds: dto.roleIds,
          },
          actorUserId,
        );

        return {
          mode: 'CONVERTED_EXISTING_USER',
          user: existingByEmail,
          profile,
        };
      }

      const tempPassword = this.generateTemporaryPassword();
      const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
      const hashedPassword = await bcrypt.hash(tempPassword, bcryptRounds);

      const user = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: Role.USER,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const profile = await this.createStaffProfileWithRoles(
        tx,
        {
          userId: user.id,
          departmentId: dto.departmentId,
          employeeCode: dto.employeeCode,
          title: dto.title,
          managerId: dto.managerId,
          status: dto.status,
          roleIds: dto.roleIds,
        },
        actorUserId,
      );

      return {
        mode: 'CREATED_NEW_USER',
        user,
        profile,
        sendActivationEmail: dto.sendActivationEmail ?? false,
        temporaryPassword: dto.sendActivationEmail ? undefined : tempPassword,
      };
    });
  }

  async listStaffProfiles(
    filters: {
      departmentId?: string;
      status?: StaffStatus;
      roleId?: string;
    },
    actorUserId?: string,
  ) {
    const scopedDepartmentId = await this.resolveScopedDepartmentId(
      actorUserId,
      filters.departmentId,
      { allowHrGlobalView: true },
    );

    return this.prisma.staffProfile.findMany({
      where: {
        ...(scopedDepartmentId ? { departmentId: scopedDepartmentId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.roleId
          ? {
              assignments: {
                some: {
                  roleId: filters.roleId,
                  effectiveFrom: { lte: new Date() },
                  OR: [
                    { effectiveTo: null },
                    { effectiveTo: { gte: new Date() } },
                  ],
                },
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        department: true,
        manager: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
          orderBy: { effectiveFrom: 'desc' },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getStaffProfile(id: string, actorUserId?: string) {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        department: true,
        manager: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        directReports: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
          orderBy: { effectiveFrom: 'desc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Staff profile not found');
    }

    const actor = await this.getActorContext(actorUserId);
    if (actor.role !== Role.ADMIN && String(actor.role) !== 'SUPER_ADMIN') {
      const canHrViewAllStaff = actor.departmentCode === 'HR';
      if (
        !canHrViewAllStaff &&
        (!actor.departmentId || actor.departmentId !== profile.departmentId)
      ) {
        throw new ForbiddenException(
          'You can only view staff profiles in your own department.',
        );
      }
    }

    return profile;
  }

  async updateStaffProfile(
    id: string,
    dto: UpdateStaffProfileDto,
    actorUserId?: string,
  ) {
    const existing = await this.prisma.staffProfile.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Staff profile not found');
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    if (dto.managerId) {
      const manager = await this.prisma.staffProfile.findUnique({
        where: { id: dto.managerId },
      });
      if (!manager) {
        throw new NotFoundException('Manager profile not found');
      }
    }

    const profile = await this.prisma.staffProfile.update({
      where: { id },
      data: {
        ...(dto.departmentId !== undefined
          ? { departmentId: dto.departmentId }
          : {}),
        ...(dto.employeeCode !== undefined
          ? { employeeCode: dto.employeeCode }
          : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.managerId !== undefined ? { managerId: dto.managerId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        user: true,
        department: true,
      },
    });

    await this.createAuditLog(
      actorUserId,
      'staffProfile.update',
      'staffProfile',
      id,
      {
        before: existing,
        after: profile,
      } as unknown as Prisma.InputJsonValue,
    );

    return profile;
  }

  async assignRoleToStaff(
    staffId: string,
    dto: AssignStaffRoleDto,
    actorUserId?: string,
  ) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    const role = await this.prisma.staffRole.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (
      dto.effectiveTo &&
      dto.effectiveFrom &&
      dto.effectiveTo < dto.effectiveFrom
    ) {
      throw new BadRequestException(
        'effectiveTo cannot be before effectiveFrom',
      );
    }

    const assignment = await this.prisma.staffAssignment.create({
      data: {
        staffId,
        roleId: dto.roleId,
        effectiveFrom: dto.effectiveFrom ?? new Date(),
        effectiveTo: dto.effectiveTo,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    await this.createAuditLog(
      actorUserId,
      'staffAssignment.create',
      'staffAssignment',
      assignment.id,
      assignment as unknown as Prisma.InputJsonValue,
    );

    return assignment;
  }

  async removeStaffAssignment(
    staffId: string,
    assignmentId: string,
    actorUserId?: string,
  ) {
    const assignment = await this.prisma.staffAssignment.findFirst({
      where: { id: assignmentId, staffId },
    });

    if (!assignment) {
      throw new NotFoundException('Staff assignment not found');
    }

    const removed = await this.prisma.staffAssignment.delete({
      where: { id: assignmentId },
    });

    await this.createAuditLog(
      actorUserId,
      'staffAssignment.delete',
      'staffAssignment',
      assignmentId,
      removed as unknown as Prisma.InputJsonValue,
    );

    return removed;
  }

  async createTask(dto: CreateStaffTaskDto, actorUserId?: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: dto.staffId },
    });
    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    const actor = await this.getActorContext(actorUserId);
    if (actor.role !== Role.ADMIN && String(actor.role) !== 'SUPER_ADMIN') {
      if (!actor.departmentId || actor.departmentId !== staff.departmentId) {
        throw new ForbiddenException(
          'You can only create tasks for staff in your own department.',
        );
      }
    }

    const task = await this.prisma.staffTask.create({
      data: {
        staffId: dto.staffId,
        type: dto.type,
        status: dto.status,
        priority: dto.priority,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
        completedAt: dto.completedAt,
      },
      include: {
        staff: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            department: true,
          },
        },
      },
    });

    await this.createAuditLog(
      actorUserId,
      'staffTask.create',
      'staffTask',
      task.id,
      task as unknown as Prisma.InputJsonValue,
    );

    return task;
  }

  async updateTask(id: string, dto: UpdateStaffTaskDto, actorUserId?: string) {
    const existing = await this.prisma.staffTask.findUnique({
      where: { id },
      include: {
        staff: {
          select: { departmentId: true },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const actor = await this.getActorContext(actorUserId);
    if (actor.role !== Role.ADMIN && String(actor.role) !== 'SUPER_ADMIN') {
      if (
        !actor.departmentId ||
        actor.departmentId !== existing.staff.departmentId
      ) {
        throw new ForbiddenException(
          'You can only update tasks in your own department.',
        );
      }
    }

    if (dto.staffId) {
      const staff = await this.prisma.staffProfile.findUnique({
        where: { id: dto.staffId },
      });
      if (!staff) {
        throw new NotFoundException('Staff profile not found');
      }
      if (actor.role !== Role.ADMIN && String(actor.role) !== 'SUPER_ADMIN') {
        if (!actor.departmentId || actor.departmentId !== staff.departmentId) {
          throw new ForbiddenException(
            'You can only reassign tasks within your own department.',
          );
        }
      }
    }

    const task = await this.prisma.staffTask.update({
      where: { id },
      data: {
        ...(dto.staffId !== undefined ? { staffId: dto.staffId } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as Prisma.InputJsonValue }
          : {}),
        ...(dto.completedAt !== undefined
          ? { completedAt: dto.completedAt }
          : {}),
      },
      include: {
        staff: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            department: true,
          },
        },
      },
    });

    await this.createAuditLog(
      actorUserId,
      'staffTask.update',
      'staffTask',
      id,
      {
        before: existing,
        after: task,
      } as unknown as Prisma.InputJsonValue,
    );

    return task;
  }

  async completeTask(id: string, actorUserId?: string) {
    const task = await this.prisma.staffTask.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            departmentId: true,
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const actor = await this.getActorContext(actorUserId);
    if (actor.role !== Role.ADMIN && String(actor.role) !== 'SUPER_ADMIN') {
      if (
        !actor.departmentId ||
        actor.departmentId !== task.staff.departmentId
      ) {
        throw new ForbiddenException(
          'You can only complete tasks in your own department.',
        );
      }
    }

    const metadata =
      task.metadata &&
      typeof task.metadata === 'object' &&
      !Array.isArray(task.metadata)
        ? (task.metadata as Record<string, unknown>)
        : undefined;
    const linkedOrderId =
      metadata?.taskKind === 'ORDER_DELIVERY' &&
      typeof metadata.orderId === 'string'
        ? metadata.orderId
        : undefined;

    const completed = await this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.staffTask.update({
        where: { id },
        data: {
          status: StaffTaskStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          staff: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              department: true,
            },
          },
        },
      });

      if (linkedOrderId) {
        const order = await tx.order.findUnique({
          where: { id: linkedOrderId },
          select: { id: true, status: true },
        });

        if (!order) {
          throw new NotFoundException(
            'Linked order for this delivery task was not found.',
          );
        }
        if (String(order.status) !== 'CONFIRMED') {
          throw new BadRequestException(
            'Linked order must be CONFIRMED before delivery can be completed.',
          );
        }

        await tx.order.update({
          where: { id: linkedOrderId },
          data: { status: 'COMPLETED' },
        });
      }

      return updatedTask;
    });

    await this.createAuditLog(
      actorUserId,
      'staffTask.complete',
      'staffTask',
      id,
      {
        ...completed,
        linkedOrderId,
      } as unknown as Prisma.InputJsonValue,
    );

    return completed;
  }

  async listTasks(
    filters: {
      departmentId?: string;
      staffId?: string;
      status?: StaffTaskStatus;
      fromDate?: Date;
      toDate?: Date;
      priority?: StaffTaskPriority;
    },
    actorUserId?: string,
  ) {
    const scopedDepartmentId = await this.resolveScopedDepartmentId(
      actorUserId,
      filters.departmentId,
    );
    const actor = await this.getActorContext(actorUserId);

    if (
      filters.staffId &&
      actor.role !== Role.ADMIN &&
      String(actor.role) !== 'SUPER_ADMIN'
    ) {
      const targetStaff = await this.prisma.staffProfile.findUnique({
        where: { id: filters.staffId },
        select: { id: true, departmentId: true },
      });
      if (!targetStaff || targetStaff.departmentId !== scopedDepartmentId) {
        throw new ForbiddenException(
          'You can only access tasks in your own department.',
        );
      }
    }

    return this.prisma.staffTask.findMany({
      where: {
        ...(filters.staffId ? { staffId: filters.staffId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(scopedDepartmentId
          ? {
              staff: {
                departmentId: scopedDepartmentId,
              },
            }
          : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              createdAt: {
                ...(filters.fromDate ? { gte: filters.fromDate } : {}),
                ...(filters.toDate ? { lte: filters.toDate } : {}),
              },
            }
          : {}),
      },
      include: {
        staff: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            department: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getPerformanceMetrics(
    filters: {
      departmentId?: string;
      staffId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    actorUserId?: string,
  ) {
    const scopedDepartmentId = await this.resolveScopedDepartmentId(
      actorUserId,
      filters.departmentId,
    );
    const actor = await this.getActorContext(actorUserId);

    if (
      filters.staffId &&
      actor.role !== Role.ADMIN &&
      String(actor.role) !== 'SUPER_ADMIN'
    ) {
      const targetStaff = await this.prisma.staffProfile.findUnique({
        where: { id: filters.staffId },
        select: { id: true, departmentId: true },
      });
      if (!targetStaff || targetStaff.departmentId !== scopedDepartmentId) {
        throw new ForbiddenException(
          'You can only access performance data in your own department.',
        );
      }
    }

    const tasks = await this.prisma.staffTask.findMany({
      where: {
        ...(filters.staffId ? { staffId: filters.staffId } : {}),
        ...(scopedDepartmentId
          ? {
              staff: {
                departmentId: scopedDepartmentId,
              },
            }
          : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              createdAt: {
                ...(filters.fromDate ? { gte: filters.fromDate } : {}),
                ...(filters.toDate ? { lte: filters.toDate } : {}),
              },
            }
          : {}),
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: true,
          },
        },
      },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === StaffTaskStatus.COMPLETED,
    ).length;
    const completionRate =
      totalTasks === 0
        ? 0
        : Number(((completedTasks / totalTasks) * 100).toFixed(2));

    const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1;
      return acc;
    }, {});

    const departmentTotals = tasks.reduce<
      Record<
        string,
        {
          departmentId: string;
          departmentName: string;
          total: number;
          completed: number;
        }
      >
    >((acc, task) => {
      const departmentId = task.staff.department.id;
      const current = acc[departmentId] ?? {
        departmentId,
        departmentName: task.staff.department.name,
        total: 0,
        completed: 0,
      };

      current.total += 1;
      if (task.status === StaffTaskStatus.COMPLETED) {
        current.completed += 1;
      }

      acc[departmentId] = current;
      return acc;
    }, {});

    const staffTotals = tasks.reduce<
      Record<
        string,
        {
          staffId: string;
          name: string;
          departmentName: string;
          total: number;
          completed: number;
        }
      >
    >((acc, task) => {
      const staffId = task.staff.id;
      const current = acc[staffId] ?? {
        staffId,
        name: task.staff.user.name,
        departmentName: task.staff.department.name,
        total: 0,
        completed: 0,
      };

      current.total += 1;
      if (task.status === StaffTaskStatus.COMPLETED) {
        current.completed += 1;
      }

      acc[staffId] = current;
      return acc;
    }, {});

    return {
      summary: {
        totalTasks,
        completedTasks,
        completionRate,
        statusCounts,
      },
      byDepartment: Object.values(departmentTotals).map((item) => ({
        ...item,
        completionRate:
          item.total === 0
            ? 0
            : Number(((item.completed / item.total) * 100).toFixed(2)),
      })),
      byStaff: Object.values(staffTotals)
        .map((item) => ({
          ...item,
          completionRate:
            item.total === 0
              ? 0
              : Number(((item.completed / item.total) * 100).toFixed(2)),
        }))
        .sort((a, b) => b.total - a.total),
    };
  }

  async listStaffAuditLogs(staffId: string, limit = 50, actorUserId?: string) {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
    });
    if (!profile) {
      throw new NotFoundException('Staff profile not found');
    }

    const actor = await this.getActorContext(actorUserId);
    if (actor.role !== Role.ADMIN && String(actor.role) !== 'SUPER_ADMIN') {
      const canHrViewAllStaff = actor.departmentCode === 'HR';
      if (
        !canHrViewAllStaff &&
        (!actor.departmentId || actor.departmentId !== profile.departmentId)
      ) {
        throw new ForbiddenException(
          'You can only view audit logs for staff in your own department.',
        );
      }
    }

    return this.prisma.staffAuditLog.findMany({
      where: {
        OR: [
          { resourceId: staffId },
          {
            resource: 'staffAssignment',
            changes: { path: ['staffId'], equals: staffId },
          },
          {
            resource: 'staffTask',
            changes: { path: ['staffId'], equals: staffId },
          },
        ],
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(limit, 200)),
    });
  }
}
