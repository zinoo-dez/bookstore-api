import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, type PrismaClient } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private notificationClient(tx?: Prisma.TransactionClient | PrismaClient) {
    return tx ?? this.prisma;
  }

  async listForUser(userId: string, dto: ListNotificationsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.unreadOnly ? { isRead: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  async remove(userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async createUserNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  }

  async createInquiryNotificationForDepartment(
    tx: Prisma.TransactionClient | PrismaClient | undefined,
    input: {
      departmentId: string;
      type: NotificationType;
      relatedEntityId: string;
      title: string;
      message: string;
      link?: string;
    },
  ) {
    const client = this.notificationClient(tx);

    const staffUsers = await client.staffProfile.findMany({
      where: {
        departmentId: input.departmentId,
        status: 'ACTIVE',
      },
      select: {
        userId: true,
      },
    });

    if (staffUsers.length === 0) {
      return { created: 0 };
    }

    const result = await client.notification.createMany({
      data: staffUsers.map((staff) => ({
        userId: staff.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      })),
    });

    return { created: result.count, relatedEntityId: input.relatedEntityId };
  }

  async createAnnouncementForAllUsers(input: {
    title: string;
    message: string;
    link?: string;
  }) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    if (users.length === 0) {
      return { created: 0 };
    }

    const result = await this.prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: 'announcement',
        title: input.title,
        message: input.message,
        link: input.link,
      })),
    });

    return { created: result.count };
  }
}
