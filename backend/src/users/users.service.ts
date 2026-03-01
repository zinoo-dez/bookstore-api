import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        staffProfile: null,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUserRole(userId: string, role: Role) {
    // Validate role
    if (!['USER', 'ADMIN'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be USER or ADMIN');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        staffProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.staffProfile) {
      throw new BadRequestException(
        'Staff account roles must be managed from the Staff module',
      );
    }

    // Update role
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUser(
    userId: string,
    data: { name?: string; email?: string; role?: Role },
    actor: { userId: string; role?: string },
  ) {
    if (!data.name && !data.email && !data.role) {
      throw new BadRequestException('At least one field must be provided');
    }

    if (data.role && !['USER', 'ADMIN', 'SUPER_ADMIN'].includes(data.role)) {
      throw new BadRequestException(
        'Invalid role. Must be USER, ADMIN, or SUPER_ADMIN',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        staffProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can modify SUPER_ADMIN');
    }

    if (
      data.role &&
      actor.role !== Role.SUPER_ADMIN &&
      data.role === Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN');
    }

    if (user.id === actor.userId && data.role && data.role !== user.role) {
      throw new BadRequestException('You cannot change your own role');
    }

    if (user.staffProfile) {
      throw new BadRequestException(
        'Staff accounts must be updated from the Staff module',
      );
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
          ...(data.role ? { role: data.role } : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already in use');
      }
      throw error;
    }
  }

  async deleteUser(userId: string, actor: { userId: string; role?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        staffProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.id === actor.userId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (user.staffProfile) {
      throw new BadRequestException(
        'Staff accounts cannot be deleted from Users. Use Staff management.',
      );
    }

    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can delete SUPER_ADMIN');
    }

    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
      return { success: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete user with existing related records',
        );
      }
      throw error;
    }
  }

  async getUserStats(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        staffProfile: {
          select: { id: true },
        },
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.staffProfile) {
      throw new BadRequestException(
        'Staff account statistics are available in the Staff module',
      );
    }

    // Get order statistics
    const orders = await this.prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        orderItems: {
          select: {
            quantity: true,
            book: {
              select: {
                title: true,
                author: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0,
    );
    const completedOrders = orders.filter(
      (o) => o.status === 'COMPLETED',
    ).length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    return {
      user: safeUser,
      stats: {
        totalOrders,
        totalSpent,
        completedOrders,
        pendingOrders,
      },
      recentOrders: orders.slice(0, 5),
    };
  }

  async setUserActiveStatus(
    userId: string,
    isActive: boolean,
    actor: { userId: string; role?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        staffProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.staffProfile) {
      throw new BadRequestException(
        'Staff accounts must be managed from the Staff module',
      );
    }

    if (user.role !== Role.USER) {
      throw new BadRequestException(
        'Only regular users can be banned or unbanned from Users management.',
      );
    }

    if (user.id === actor.userId && !isActive) {
      throw new BadRequestException('You cannot ban your own account');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
