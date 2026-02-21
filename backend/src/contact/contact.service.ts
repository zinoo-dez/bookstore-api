import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  ContactType,
  InquiryAuditAction,
  InquiryPriority,
  InquiryStatus,
  InquiryType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const INBOX_BY_TYPE: Record<ContactType, string> = {
  support: 'support@bookstore.local',
  author: 'authors@bookstore.local',
  publisher: 'publishers@bookstore.local',
  business: 'business@bookstore.local',
  legal: 'legal@bookstore.local',
};

const AUTO_REPLY_BY_TYPE: Record<ContactType, string> = {
  support:
    'Thanks for reaching out. Our support team will get back to you within 24–48 hours.',
  author:
    'Thanks for getting in touch. We usually respond within 2–3 business days.',
  publisher:
    'Thanks for contacting us. Our publishing team will respond shortly.',
  business: 'Thanks for reaching out. Our business team will follow up soon.',
  legal: 'Thanks for your message. Our legal/technical team will respond soon.',
};

const DEPARTMENT_CODE_BY_CONTACT_TYPE: Record<ContactType, string> = {
  support: 'CS',
  author: 'CS',
  publisher: 'CS',
  business: 'FIN',
  legal: 'FIN',
};

const INQUIRY_TYPE_BY_CONTACT_TYPE: Record<ContactType, InquiryType> = {
  support: 'other',
  author: 'author',
  publisher: 'author',
  business: 'payment',
  legal: 'legal',
};

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMessage(dto: CreateContactDto) {
    const message = await this.prisma.contactMessage.create({
      data: {
        type: dto.type,
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        metadata: dto.metadata,
        status: 'new',
      },
    });

    const inbox = INBOX_BY_TYPE[dto.type];
    const subject = dto.subject || `New ${dto.type} inquiry`;

    await this.prisma.contactNotification.createMany({
      data: [
        {
          type: dto.type,
          recipient: inbox,
          subject,
          body: dto.message,
          messageId: message.id,
        },
        {
          type: dto.type,
          recipient: dto.email,
          subject: `We received your message`,
          body: AUTO_REPLY_BY_TYPE[dto.type],
          messageId: message.id,
        },
      ],
    });

    const linkedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (linkedUser) {
      const targetDepartment = await this.prisma.department.findFirst({
        where: {
          code: DEPARTMENT_CODE_BY_CONTACT_TYPE[dto.type],
          isActive: true,
        },
        select: { id: true },
      });

      if (targetDepartment) {
        await this.prisma.$transaction(async (tx) => {
          const inquiry = await tx.inquiry.create({
            data: {
              type: INQUIRY_TYPE_BY_CONTACT_TYPE[dto.type],
              departmentId: targetDepartment.id,
              status: InquiryStatus.OPEN,
              priority: InquiryPriority.MEDIUM,
              createdByUserId: linkedUser.id,
              subject: dto.subject || `Contact inquiry (${dto.type})`,
            },
          });

          await tx.inquiryMessage.create({
            data: {
              inquiryId: inquiry.id,
              senderId: linkedUser.id,
              senderType: 'USER',
              message: dto.message,
            },
          });

          await tx.inquiryAudit.create({
            data: {
              inquiryId: inquiry.id,
              action: InquiryAuditAction.CREATED,
              toDepartmentId: targetDepartment.id,
              performedByUserId: linkedUser.id,
            },
          });

          await this.notificationsService.createInquiryNotificationForDepartment(
            tx,
            {
              departmentId: targetDepartment.id,
              type: 'inquiry_created',
              relatedEntityId: inquiry.id,
              title: 'New inquiry from contact form',
              message: dto.subject || 'Contact inquiry submitted',
              link: `/admin/inquiries/${inquiry.id}`,
            },
          );
        });
      }

      await this.notificationsService.createUserNotification({
        userId: linkedUser.id,
        type: 'inquiry_update',
        title: 'Inquiry received',
        message:
          'We received your inquiry and routed it to our staff. You will get an update soon.',
        link: '/contact',
      });
    }

    return message;
  }

  async listNotifications(limit = 10) {
    return this.prisma.contactNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
