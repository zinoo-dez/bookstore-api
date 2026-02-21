import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  InquiryAuditAction,
  InquiryPriority,
  InquirySenderType,
  InquiryStatus,
  InquiryType,
  Prisma,
  type Role,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AddInquiryMessageDto } from './dto/add-inquiry-message.dto';
import { AddInternalNoteDto } from './dto/add-internal-note.dto';
import { AssignInquiryDto } from './dto/assign-inquiry.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { EscalateInquiryDto } from './dto/escalate-inquiry.dto';
import { ListInquiriesDto } from './dto/list-inquiries.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { CreateInquiryTemplateDto } from './dto/create-inquiry-template.dto';
import { UpdateInquiryTemplateDto } from './dto/update-inquiry-template.dto';

type ScopeType = 'GLOBAL' | 'DEPARTMENT' | 'ASSIGNED_ONLY' | 'SELF_ONLY';

type AuthUser = {
  sub: string;
  role?: string;
  permissions?: string[];
};

type ActorContext = {
  userId: string;
  role?: Role | string;
  permissions: Set<string>;
  staffProfileId?: string;
  departmentId?: string;
};

type InquiryOverviewResponse = {
  totals: {
    total: number;
    unresolved: number;
    resolved: number;
    unchecked: number;
    inCharge: number;
  };
  staffPerformance: Array<{
    staffProfileId: string;
    staffName: string;
    staffEmail: string;
    solvedCount: number;
    resolvedCount: number;
    closedCount: number;
    activeCount: number;
    assignedTotal: number;
  }>;
};

type QuickReplyTemplate = {
  id: string;
  title: string;
  body: string;
  type: InquiryType | 'COMMON';
  tags: string[];
};

const DEFAULT_QUICK_REPLY_TEMPLATES: Array<{
  id: string;
  title: string;
  body: string;
  type: InquiryType | null;
  tags: string[];
}> = [
  {
    id: 'common_ack_investigating',
    title: 'Acknowledge and Investigate',
    body: 'Thank you for reaching out. We have received your request and are actively checking this for you now. We will update you shortly with the next step.',
    type: null,
    tags: ['triage', 'general'],
  },
  {
    id: 'common_need_details',
    title: 'Request More Details',
    body: 'To help you faster, please share the order number and a short description of what happened. If available, include a screenshot so we can verify immediately.',
    type: null,
    tags: ['triage'],
  },
  {
    id: 'order_delivery_delay',
    title: 'Delivery Delay Update',
    body: 'We checked your order and confirmed there is a delivery delay. We are coordinating with logistics and will send your next update within 24 hours.',
    type: InquiryType.order,
    tags: ['delivery'],
  },
  {
    id: 'payment_refund_in_progress',
    title: 'Refund In Progress',
    body: 'Your refund request is now in progress with our finance team. We will notify you once processing is complete and share the transaction reference.',
    type: InquiryType.payment,
    tags: ['refund'],
  },
  {
    id: 'author_handoff',
    title: 'Author Team Handoff',
    body: 'Thank you for your inquiry. We have forwarded this to our author support team and they will follow up with you shortly.',
    type: InquiryType.author,
    tags: ['handoff'],
  },
  {
    id: 'stock_check_started',
    title: 'Stock Check Started',
    body: 'We are checking current stock availability with our warehouse team. We will update you as soon as confirmation is complete.',
    type: InquiryType.stock,
    tags: ['inventory'],
  },
  {
    id: 'legal_review_started',
    title: 'Legal Review Started',
    body: 'Your request has been escalated to our legal review team. We will share an update as soon as their review is complete.',
    type: InquiryType.legal,
    tags: ['escalation'],
  },
];

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getActorContext(user: AuthUser): Promise<ActorContext> {
    const profile = await this.prisma.staffProfile.findFirst({
      where: { userId: user.sub, status: 'ACTIVE' },
      select: { id: true, departmentId: true },
    });

    return {
      userId: user.sub,
      role: user.role,
      permissions: new Set(user.permissions ?? []),
      staffProfileId: profile?.id,
      departmentId: profile?.departmentId,
    };
  }

  private isBypass(actor: ActorContext): boolean {
    return actor.role === 'ADMIN' || String(actor.role) === 'SUPER_ADMIN';
  }

  private hasAnyPermission(actor: ActorContext, keys: string[]): boolean {
    if (this.isBypass(actor) || actor.permissions.has('*')) {
      return true;
    }
    return keys.some((key) => actor.permissions.has(key));
  }

  private ensureAnyPermission(actor: ActorContext, keys: string[]) {
    if (!this.hasAnyPermission(actor, keys)) {
      throw new ForbiddenException(
        `Missing required permission. One of: ${keys.join(', ')}`,
      );
    }
  }

  private resolveViewScope(actor: ActorContext): ScopeType {
    if (this.isBypass(actor)) return 'GLOBAL';
    if (
      this.hasAnyPermission(actor, [
        'support.inquiries.view',
        'finance.inquiries.view',
        'marketing.inquiries.view',
      ])
    )
      return 'DEPARTMENT';
    if (this.hasAnyPermission(actor, ['department.inquiries.view']))
      return 'ASSIGNED_ONLY';
    if (this.hasAnyPermission(actor, ['inquiries.view'])) return 'SELF_ONLY';
    throw new ForbiddenException('Missing permission to view inquiries');
  }

  private ensureDepartmentScope(actor: ActorContext): string {
    if (!actor.departmentId) {
      throw new ForbiddenException(
        'Department-scoped access requires active staff profile',
      );
    }
    return actor.departmentId;
  }

  private whereForScope(
    actor: ActorContext,
    scope: ScopeType,
  ): Prisma.InquiryWhereInput {
    if (scope === 'GLOBAL') return {};
    if (scope === 'SELF_ONLY') return { createdByUserId: actor.userId };
    if (scope === 'ASSIGNED_ONLY') {
      if (!actor.staffProfileId) {
        throw new ForbiddenException(
          'Assigned scope requires active staff profile',
        );
      }
      return { assignedToStaffId: actor.staffProfileId };
    }

    const departmentId = this.ensureDepartmentScope(actor);
    return {
      OR: [
        { departmentId },
        {
          audits: {
            some: {
              action: InquiryAuditAction.ESCALATED,
              fromDepartmentId: departmentId,
            },
          },
        },
      ],
    };
  }

  private async recordAudit(
    tx: Prisma.TransactionClient,
    input: {
      inquiryId: string;
      action: InquiryAuditAction;
      performedByUserId: string;
      fromDepartmentId?: string | null;
      toDepartmentId?: string | null;
    },
  ) {
    await tx.inquiryAudit.create({
      data: {
        inquiryId: input.inquiryId,
        action: input.action,
        performedByUserId: input.performedByUserId,
        fromDepartmentId: input.fromDepartmentId ?? null,
        toDepartmentId: input.toDepartmentId ?? null,
      },
    });
  }

  private async loadInquiryOrThrow(
    inquiryId: string,
    where: Prisma.InquiryWhereInput,
  ) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: {
        id: inquiryId,
        ...where,
      },
      include: {
        department: true,
        assignedToStaff: {
          select: {
            id: true,
            userId: true,
            departmentId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
        internalNotes: { orderBy: { createdAt: 'desc' } },
        audits: {
          select: { fromDepartmentId: true, action: true },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    return inquiry;
  }

  private stripInternalForCustomer<T>(value: T, actor: ActorContext): T {
    if (this.isBypass(actor) || actor.staffProfileId) {
      return value;
    }
    const clone = { ...(value as Record<string, unknown>) } as Record<
      string,
      unknown
    >;
    delete clone.internalNotes;
    return clone as T;
  }

  private buildWorkflowCountsWhere(
    scopedWhere: Prisma.InquiryWhereInput,
    status: InquiryStatus[],
  ): Prisma.InquiryWhereInput {
    return {
      ...scopedWhere,
      status: {
        in: status,
      },
    };
  }

  private async ensureDefaultQuickReplyTemplates() {
    try {
      const count = await this.prisma.inquiryQuickReplyTemplate.count();
      if (count > 0) return true;

      await this.prisma.inquiryQuickReplyTemplate.createMany({
        data: DEFAULT_QUICK_REPLY_TEMPLATES,
        skipDuplicates: true,
      });
      return true;
    } catch (error) {
      if (this.isMissingQuickReplyTableError(error)) {
        return false;
      }
      throw error;
    }
  }

  private isMissingQuickReplyTableError(error: unknown) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2021'
    ) {
      return false;
    }
    const table = String(
      (error.meta as { table?: unknown } | undefined)?.table ?? '',
    );
    return table.includes('InquiryQuickReplyTemplate');
  }

  private throwQuickReplyTemplateUnavailable() {
    throw new ServiceUnavailableException(
      'Quick reply templates are temporarily unavailable. Please run database migrations.',
    );
  }

  async createInquiry(user: AuthUser, dto: CreateInquiryDto) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, ['inquiries.create']);

    const supportDepartment = await this.prisma.department.findFirst({
      where: { code: 'CS', isActive: true },
      select: { id: true, name: true },
    });
    if (!supportDepartment) {
      throw new NotFoundException('Customer Support department not configured');
    }

    const inquiry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inquiry.create({
        data: {
          type: dto.type,
          priority: dto.priority ?? InquiryPriority.MEDIUM,
          subject: dto.subject,
          departmentId: supportDepartment.id,
          status: InquiryStatus.OPEN,
          createdByUserId: actor.userId,
        },
      });

      await tx.inquiryMessage.create({
        data: {
          inquiryId: created.id,
          senderId: actor.userId,
          senderType: InquirySenderType.USER,
          message: dto.message,
        },
      });

      await this.recordAudit(tx, {
        inquiryId: created.id,
        action: InquiryAuditAction.CREATED,
        performedByUserId: actor.userId,
        toDepartmentId: supportDepartment.id,
      });

      await this.notificationsService.createInquiryNotificationForDepartment(
        tx,
        {
          departmentId: supportDepartment.id,
          type: 'inquiry_created',
          relatedEntityId: created.id,
          title: 'New inquiry in Customer Support queue',
          message: dto.subject,
          link: `/admin/inquiries/${created.id}`,
        },
      );

      return created;
    });

    return inquiry;
  }

  async listInquiries(user: AuthUser, dto: ListInquiriesDto) {
    const actor = await this.getActorContext(user);
    const scope = this.resolveViewScope(actor);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    const scopedWhere = this.whereForScope(actor, scope);

    const where: Prisma.InquiryWhereInput = {
      ...scopedWhere,
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.priority ? { priority: dto.priority } : {}),
      ...(dto.q ? { subject: { contains: dto.q, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          department: true,
          assignedToStaff: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.inquiry.count({ where }),
    ]);

    return {
      items: items.map((item) => this.stripInternalForCustomer(item, actor)),
      total,
      page,
      limit,
    };
  }

  async getInquiry(user: AuthUser, inquiryId: string) {
    const actor = await this.getActorContext(user);
    const scope = this.resolveViewScope(actor);
    const inquiry = await this.loadInquiryOrThrow(
      inquiryId,
      this.whereForScope(actor, scope),
    );
    return this.stripInternalForCustomer(inquiry, actor);
  }

  async addMessage(
    user: AuthUser,
    inquiryId: string,
    dto: AddInquiryMessageDto,
  ) {
    const actor = await this.getActorContext(user);
    const scope = this.resolveViewScope(actor);
    const inquiry = await this.loadInquiryOrThrow(
      inquiryId,
      this.whereForScope(actor, scope),
    );
    const isStaff = this.isBypass(actor) || !!actor.staffProfileId;

    if (isStaff) {
      this.ensureAnyPermission(actor, [
        'support.inquiries.reply',
        'finance.inquiries.reply',
        'marketing.inquiries.reply',
        'marketing.inquiries.manage',
        'department.inquiries.reply',
      ]);
      if (
        this.hasAnyPermission(actor, ['department.inquiries.reply']) &&
        !this.hasAnyPermission(actor, [
          'support.inquiries.reply',
          'finance.inquiries.reply',
          'marketing.inquiries.reply',
          'marketing.inquiries.manage',
        ]) &&
        inquiry.assignedToStaffId !== actor.staffProfileId
      ) {
        throw new ForbiddenException(
          'Assigned-only staff can only reply to assigned inquiries',
        );
      }
    } else {
      this.ensureAnyPermission(actor, ['inquiries.view']);
      if (inquiry.createdByUserId !== actor.userId) {
        throw new ForbiddenException('Cannot reply to another user inquiry');
      }
    }

    const senderType = isStaff
      ? InquirySenderType.STAFF
      : InquirySenderType.USER;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.inquiryMessage.create({
        data: {
          inquiryId,
          senderId: actor.userId,
          senderType,
          message: dto.message,
        },
      });

      const shouldAutoAssignToActor =
        senderType === InquirySenderType.STAFF &&
        !!actor.staffProfileId &&
        !inquiry.assignedToStaffId;
      const nextStatus =
        inquiry.status === InquiryStatus.OPEN ||
        inquiry.status === InquiryStatus.ASSIGNED
          ? InquiryStatus.IN_PROGRESS
          : inquiry.status;
      const next = await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          status: nextStatus,
          ...(shouldAutoAssignToActor
            ? { assignedToStaffId: actor.staffProfileId }
            : {}),
        },
      });

      if (shouldAutoAssignToActor) {
        await this.recordAudit(tx, {
          inquiryId,
          action: InquiryAuditAction.ASSIGNED,
          performedByUserId: actor.userId,
          toDepartmentId: inquiry.departmentId,
        });
      }

      if (nextStatus !== inquiry.status) {
        await this.recordAudit(tx, {
          inquiryId,
          action: InquiryAuditAction.STATUS_CHANGED,
          performedByUserId: actor.userId,
          toDepartmentId: inquiry.departmentId,
        });
      }

      if (senderType === InquirySenderType.USER) {
        if (inquiry.assignedToStaff?.userId) {
          await this.notificationsService.createUserNotification({
            userId: inquiry.assignedToStaff.userId,
            type: 'inquiry_reply',
            title: 'Customer replied to inquiry',
            message: inquiry.subject,
            link: `/admin/inquiries/${inquiry.id}`,
          });
        } else {
          await this.notificationsService.createInquiryNotificationForDepartment(
            tx,
            {
              departmentId: inquiry.departmentId,
              type: 'inquiry_reply',
              relatedEntityId: inquiry.id,
              title: 'New customer reply in department queue',
              message: inquiry.subject,
              link: `/admin/inquiries/${inquiry.id}`,
            },
          );
        }
      } else {
        await this.notificationsService.createUserNotification({
          userId: inquiry.createdByUserId,
          type: 'inquiry_reply',
          title: 'Staff replied to your inquiry',
          message: inquiry.subject,
          link: `/inquiries/${inquiry.id}`,
        });
      }

      return next;
    });

    return updated;
  }

  async addInternalNote(
    user: AuthUser,
    inquiryId: string,
    dto: AddInternalNoteDto,
  ) {
    const actor = await this.getActorContext(user);
    if (!actor.staffProfileId && !this.isBypass(actor)) {
      throw new ForbiddenException('Only staff can create internal notes');
    }

    this.ensureAnyPermission(actor, [
      'support.inquiries.reply',
      'support.inquiries.assign',
      'support.inquiries.escalate',
      'finance.inquiries.manage',
      'marketing.inquiries.reply',
      'marketing.inquiries.manage',
      'department.inquiries.reply',
    ]);

    const scope = this.resolveViewScope(actor);
    const inquiry = await this.loadInquiryOrThrow(
      inquiryId,
      this.whereForScope(actor, scope),
    );

    if (
      !this.isBypass(actor) &&
      actor.departmentId &&
      inquiry.departmentId !== actor.departmentId &&
      !inquiry.audits.some(
        (audit: { fromDepartmentId: string | null }) =>
          audit.fromDepartmentId === actor.departmentId,
      )
    ) {
      throw new ForbiddenException(
        'Cannot write internal note outside your scope',
      );
    }

    return this.prisma.inquiryInternalNote.create({
      data: {
        inquiryId,
        staffId: actor.staffProfileId!,
        note: dto.note,
      },
    });
  }

  async assignInquiry(
    user: AuthUser,
    inquiryId: string,
    dto: AssignInquiryDto,
  ) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, [
      'support.inquiries.assign',
      'finance.inquiries.manage',
      'marketing.inquiries.manage',
    ]);

    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { assignedToStaff: { select: { userId: true } } },
    });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    if (
      !this.isBypass(actor) &&
      inquiry.departmentId !== this.ensureDepartmentScope(actor)
    ) {
      throw new ForbiddenException(
        'Cannot assign inquiry from another department',
      );
    }

    const assignee = await this.prisma.staffProfile.findUnique({
      where: { id: dto.staffProfileId },
      select: { id: true, userId: true, departmentId: true, status: true },
    });
    if (!assignee || assignee.status !== 'ACTIVE') {
      throw new NotFoundException(
        'Assignee staff profile not found or inactive',
      );
    }
    if (assignee.departmentId !== inquiry.departmentId) {
      throw new ForbiddenException(
        'Assignee must belong to the inquiry department',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          assignedToStaffId: dto.staffProfileId,
          status: InquiryStatus.ASSIGNED,
        },
      });

      await this.recordAudit(tx, {
        inquiryId,
        action: InquiryAuditAction.ASSIGNED,
        performedByUserId: actor.userId,
        toDepartmentId: inquiry.departmentId,
      });

      await this.notificationsService.createUserNotification({
        userId: assignee.userId,
        type: 'inquiry_assigned',
        title: 'Inquiry assigned to you',
        message: inquiry.subject,
        link: `/admin/inquiries/${inquiry.id}`,
      });

      return next;
    });

    return updated;
  }

  async escalateInquiry(
    user: AuthUser,
    inquiryId: string,
    dto: EscalateInquiryDto,
  ) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, [
      'support.inquiries.escalate',
      'finance.inquiries.manage',
      'marketing.inquiries.manage',
    ]);

    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    const fromDepartmentId = inquiry.departmentId;

    if (
      !this.isBypass(actor) &&
      fromDepartmentId !== this.ensureDepartmentScope(actor)
    ) {
      throw new ForbiddenException(
        'Cannot escalate inquiry from another department',
      );
    }

    const nextDepartment = await this.prisma.department.findUnique({
      where: { id: dto.toDepartmentId },
      select: { id: true, isActive: true },
    });
    if (!nextDepartment || !nextDepartment.isActive) {
      throw new NotFoundException('Target department not found or inactive');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          departmentId: dto.toDepartmentId,
          assignedToStaffId: null,
          status: InquiryStatus.ESCALATED,
        },
      });

      await this.recordAudit(tx, {
        inquiryId,
        action: InquiryAuditAction.ESCALATED,
        fromDepartmentId,
        toDepartmentId: dto.toDepartmentId,
        performedByUserId: actor.userId,
      });

      await this.notificationsService.createInquiryNotificationForDepartment(
        tx,
        {
          departmentId: dto.toDepartmentId,
          type: 'inquiry_escalated',
          relatedEntityId: inquiry.id,
          title: 'Escalated inquiry in your queue',
          message: inquiry.subject,
          link: `/admin/inquiries/${inquiry.id}`,
        },
      );

      return next;
    });

    return updated;
  }

  async updateStatus(
    user: AuthUser,
    inquiryId: string,
    dto: UpdateInquiryStatusDto,
  ) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, [
      'support.inquiries.reply',
      'support.inquiries.assign',
      'support.inquiries.escalate',
      'finance.inquiries.manage',
      'marketing.inquiries.reply',
      'marketing.inquiries.manage',
      'department.inquiries.reply',
    ]);

    const scope = this.resolveViewScope(actor);
    const inquiry = await this.loadInquiryOrThrow(
      inquiryId,
      this.whereForScope(actor, scope),
    );

    if (
      scope === 'ASSIGNED_ONLY' &&
      inquiry.assignedToStaffId !== actor.staffProfileId
    ) {
      throw new ForbiddenException(
        'Assigned-only staff can only update assigned inquiries',
      );
    }
    if (
      scope === 'DEPARTMENT' &&
      !this.isBypass(actor) &&
      inquiry.departmentId !== actor.departmentId
    ) {
      throw new ForbiddenException(
        'Cannot update inquiry outside your department',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const shouldAutoAssignToActor =
        !!actor.staffProfileId &&
        !this.isBypass(actor) &&
        !inquiry.assignedToStaffId;
      const next = await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          status: dto.status,
          ...(shouldAutoAssignToActor
            ? { assignedToStaffId: actor.staffProfileId }
            : {}),
        },
      });

      if (shouldAutoAssignToActor) {
        await this.recordAudit(tx, {
          inquiryId,
          action: InquiryAuditAction.ASSIGNED,
          performedByUserId: actor.userId,
          toDepartmentId: inquiry.departmentId,
        });
      }

      await this.recordAudit(tx, {
        inquiryId,
        action:
          dto.status === InquiryStatus.CLOSED
            ? InquiryAuditAction.CLOSED
            : InquiryAuditAction.STATUS_CHANGED,
        performedByUserId: actor.userId,
        toDepartmentId: inquiry.departmentId,
      });
      return next;
    });

    return updated;
  }

  async getOverview(
    user: AuthUser,
    days?: number,
  ): Promise<InquiryOverviewResponse> {
    const actor = await this.getActorContext(user);
    if (!this.isBypass(actor)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can view inquiry overview',
      );
    }

    const scope = this.resolveViewScope(actor);
    const scopedWhere = this.whereForScope(actor, scope);
    const since =
      typeof days === 'number'
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        : null;
    const whereForWindow: Prisma.InquiryWhereInput = since
      ? {
          AND: [scopedWhere, { createdAt: { gte: since } }],
        }
      : scopedWhere;
    const unresolvedStatuses = [
      InquiryStatus.OPEN,
      InquiryStatus.ASSIGNED,
      InquiryStatus.IN_PROGRESS,
      InquiryStatus.ESCALATED,
    ];
    const solvedStatuses = [InquiryStatus.RESOLVED, InquiryStatus.CLOSED];

    const [total, unresolved, resolved, unchecked, inCharge, byStaff] =
      await Promise.all([
        this.prisma.inquiry.count({ where: whereForWindow }),
        this.prisma.inquiry.count({
          where: this.buildWorkflowCountsWhere(whereForWindow, unresolvedStatuses),
        }),
        this.prisma.inquiry.count({
          where: this.buildWorkflowCountsWhere(whereForWindow, solvedStatuses),
        }),
        this.prisma.inquiry.count({
          where: {
            ...whereForWindow,
            status: InquiryStatus.OPEN,
            assignedToStaffId: null,
          },
        }),
        this.prisma.inquiry.count({
          where: {
            ...whereForWindow,
            assignedToStaffId: { not: null },
            status: { in: unresolvedStatuses },
          },
        }),
        this.prisma.inquiry.findMany({
          where: {
            ...whereForWindow,
            assignedToStaffId: { not: null },
          },
          select: {
            assignedToStaffId: true,
            status: true,
            assignedToStaff: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    const staffMap = new Map<
      string,
      {
        staffProfileId: string;
        staffName: string;
        staffEmail: string;
        solvedCount: number;
        resolvedCount: number;
        closedCount: number;
        activeCount: number;
        assignedTotal: number;
      }
    >();

    for (const row of byStaff) {
      const staffId = row.assignedToStaffId;
      if (!staffId) continue;

      const existing = staffMap.get(staffId) ?? {
        staffProfileId: staffId,
        staffName: row.assignedToStaff?.user.name ?? 'Unknown staff',
        staffEmail: row.assignedToStaff?.user.email ?? '—',
        solvedCount: 0,
        resolvedCount: 0,
        closedCount: 0,
        activeCount: 0,
        assignedTotal: 0,
      };

      existing.assignedTotal += 1;
      if (row.status === InquiryStatus.RESOLVED) {
        existing.resolvedCount += 1;
        existing.solvedCount += 1;
      } else if (row.status === InquiryStatus.CLOSED) {
        existing.closedCount += 1;
        existing.solvedCount += 1;
      } else {
        existing.activeCount += 1;
      }
      staffMap.set(staffId, existing);
    }

    const staffPerformance = Array.from(staffMap.values())
      .sort((a, b) => {
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
        return a.staffName.localeCompare(b.staffName);
      })
      .slice(0, 12);

    return {
      totals: {
        total,
        unresolved,
        resolved,
        unchecked,
        inCharge,
      },
      staffPerformance,
    };
  }

  async listQuickReplyTemplates(user: AuthUser, type?: InquiryType) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, [
      'support.inquiries.view',
      'support.inquiries.reply',
      'finance.inquiries.view',
      'finance.inquiries.reply',
      'marketing.inquiries.view',
      'marketing.inquiries.reply',
      'marketing.inquiries.manage',
      'department.inquiries.view',
      'department.inquiries.reply',
      'inquiries.view',
    ]);

    const templatesEnabled = await this.ensureDefaultQuickReplyTemplates();
    if (!templatesEnabled) {
      return [];
    }

    let templates: Awaited<
      ReturnType<typeof this.prisma.inquiryQuickReplyTemplate.findMany>
    > = [];
    try {
      templates = await this.prisma.inquiryQuickReplyTemplate.findMany({
        where: type
          ? {
              OR: [{ type: null }, { type }],
            }
          : undefined,
        orderBy: [{ createdAt: 'asc' }],
      });
    } catch (error) {
      if (this.isMissingQuickReplyTableError(error)) {
        return [];
      }
      throw error;
    }

    return templates.map(
      (item): QuickReplyTemplate => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type ?? 'COMMON',
        tags: item.tags ?? [],
      }),
    );
  }

  async createQuickReplyTemplate(user: AuthUser, dto: CreateInquiryTemplateDto) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, [
      'support.inquiries.assign',
      'support.inquiries.escalate',
      'finance.inquiries.manage',
      'marketing.inquiries.manage',
      'admin.permission.manage',
    ]);

    let template: Awaited<
      ReturnType<typeof this.prisma.inquiryQuickReplyTemplate.create>
    >;
    try {
      template = await this.prisma.inquiryQuickReplyTemplate.create({
        data: {
          id: `custom_${randomUUID()}`,
          title: dto.title.trim(),
          body: dto.body.trim(),
          type: dto.type && dto.type !== 'COMMON' ? dto.type : null,
          tags: (dto.tags ?? []).map((item) => item.trim()).filter(Boolean),
          createdByUserId: actor.userId,
        },
      });
    } catch (error) {
      if (this.isMissingQuickReplyTableError(error)) {
        this.throwQuickReplyTemplateUnavailable();
      }
      throw error;
    }

    return {
      title: dto.title.trim(),
      body: dto.body.trim(),
      id: template.id,
      type: template.type ?? 'COMMON',
      tags: template.tags ?? [],
    };
  }

  async updateQuickReplyTemplate(
    user: AuthUser,
    templateId: string,
    dto: UpdateInquiryTemplateDto,
  ) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, [
      'support.inquiries.assign',
      'support.inquiries.escalate',
      'finance.inquiries.manage',
      'marketing.inquiries.manage',
      'admin.permission.manage',
    ]);

    let existing: { id: string } | null = null;
    try {
      existing = await this.prisma.inquiryQuickReplyTemplate.findUnique({
        where: { id: templateId },
        select: { id: true },
      });
    } catch (error) {
      if (this.isMissingQuickReplyTableError(error)) {
        this.throwQuickReplyTemplateUnavailable();
      }
      throw error;
    }
    if (!existing) {
      throw new NotFoundException('Template not found');
    }
    let updated: Awaited<
      ReturnType<typeof this.prisma.inquiryQuickReplyTemplate.update>
    >;
    try {
      updated = await this.prisma.inquiryQuickReplyTemplate.update({
        where: { id: templateId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
          ...(dto.type !== undefined
            ? { type: dto.type === 'COMMON' ? null : dto.type }
            : {}),
          ...(dto.tags !== undefined
            ? { tags: dto.tags.map((item) => item.trim()).filter(Boolean) }
            : {}),
        },
      });
    } catch (error) {
      if (this.isMissingQuickReplyTableError(error)) {
        this.throwQuickReplyTemplateUnavailable();
      }
      throw error;
    }

    return {
      id: updated.id,
      title: updated.title,
      body: updated.body,
      type: updated.type ?? 'COMMON',
      tags: updated.tags ?? [],
    };
  }

  async deleteQuickReplyTemplate(user: AuthUser, templateId: string) {
    const actor = await this.getActorContext(user);
    this.ensureAnyPermission(actor, [
      'support.inquiries.assign',
      'support.inquiries.escalate',
      'finance.inquiries.manage',
      'marketing.inquiries.manage',
      'admin.permission.manage',
    ]);

    let exists: { id: string } | null = null;
    try {
      exists = await this.prisma.inquiryQuickReplyTemplate.findUnique({
        where: { id: templateId },
        select: { id: true },
      });
    } catch (error) {
      if (this.isMissingQuickReplyTableError(error)) {
        this.throwQuickReplyTemplateUnavailable();
      }
      throw error;
    }
    if (!exists) {
      throw new NotFoundException('Template not found');
    }
    try {
      await this.prisma.inquiryQuickReplyTemplate.delete({
        where: { id: templateId },
      });
    } catch (error) {
      if (this.isMissingQuickReplyTableError(error)) {
        this.throwQuickReplyTemplateUnavailable();
      }
      throw error;
    }
    return { success: true };
  }

  async listAudit(user: AuthUser, inquiryId: string) {
    const actor = await this.getActorContext(user);
    const scope = this.resolveViewScope(actor);
    await this.loadInquiryOrThrow(inquiryId, this.whereForScope(actor, scope));

    return this.prisma.inquiryAudit.findMany({
      where: { inquiryId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
