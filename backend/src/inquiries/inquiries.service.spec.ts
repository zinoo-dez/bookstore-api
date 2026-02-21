import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InquiryStatus } from '@prisma/client';
import { InquiriesService } from './inquiries.service';

describe('InquiriesService', () => {
  const makeService = () => {
    const prisma = {
      staffProfile: { findFirst: jest.fn(), findUnique: jest.fn() },
      department: { findFirst: jest.fn(), findUnique: jest.fn() },
      inquiry: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      inquiryMessage: { create: jest.fn() },
      inquiryAudit: { create: jest.fn(), findMany: jest.fn() },
      inquiryInternalNote: { create: jest.fn() },
      $transaction: jest.fn(),
    } as any;

    const notifications = {
      createInquiryNotificationForDepartment: jest.fn(),
      createUserNotification: jest.fn(),
    } as any;

    return {
      prisma,
      notifications,
      service: new InquiriesService(prisma, notifications),
    };
  };

  it('filters list by SELF_ONLY scope for customer', async () => {
    const { prisma, service } = makeService();
    prisma.staffProfile.findFirst.mockResolvedValue(null);
    prisma.inquiry.findMany.mockResolvedValue([]);
    prisma.inquiry.count.mockResolvedValue(0);

    await service.listInquiries(
      { sub: 'user-1', role: 'USER', permissions: ['inquiries.view'] },
      {},
    );

    expect(prisma.inquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdByUserId: 'user-1',
        }),
      }),
    );
  });

  it('blocks addMessage for assigned-only staff on unassigned inquiry', async () => {
    const { prisma, service } = makeService();
    prisma.staffProfile.findFirst.mockResolvedValue({
      id: 'staff-1',
      departmentId: 'dept-1',
    });
    prisma.inquiry.findFirst.mockResolvedValue({
      id: 'inq-1',
      createdByUserId: 'cust-1',
      departmentId: 'dept-1',
      assignedToStaffId: 'staff-2',
      status: InquiryStatus.OPEN,
      subject: 'x',
      assignedToStaff: null,
      messages: [],
      internalNotes: [],
      audits: [],
    });

    await expect(
      service.addMessage(
        {
          sub: 'user-2',
          role: 'USER',
          permissions: ['department.inquiries.reply'],
        },
        'inq-1',
        { message: 'test' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks finance user from assigning inquiry in another department', async () => {
    const { prisma, service } = makeService();
    prisma.staffProfile.findFirst.mockResolvedValue({
      id: 'staff-fin',
      departmentId: 'dept-fin',
    });
    prisma.inquiry.findUnique.mockResolvedValue({
      id: 'inq-1',
      departmentId: 'dept-support',
      subject: 'Need help',
      assignedToStaff: null,
    });

    await expect(
      service.assignInquiry(
        {
          sub: 'fin-user',
          role: 'USER',
          permissions: ['finance.inquiries.manage'],
        },
        'inq-1',
        { staffProfileId: 'staff-target' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates inquiry and audit on customer submission', async () => {
    const { prisma, notifications, service } = makeService();
    prisma.staffProfile.findFirst.mockResolvedValue(null);
    prisma.department.findFirst.mockResolvedValue({
      id: 'dept-cs',
      name: 'Customer Support',
    });
    prisma.$transaction.mockImplementation(
      async (fn: (tx: any) => Promise<any>) =>
        fn({
          inquiry: { create: jest.fn().mockResolvedValue({ id: 'inq-new' }) },
          inquiryMessage: {
            create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
          },
          inquiryAudit: {
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
          staffProfile: { findMany: jest.fn().mockResolvedValue([]) },
          notification: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        }),
    );

    const result = await service.createInquiry(
      { sub: 'customer-1', role: 'USER', permissions: ['inquiries.create'] },
      { type: 'other', subject: 'Question', message: 'Help me' },
    );

    expect(result).toEqual({ id: 'inq-new' });
    expect(
      notifications.createInquiryNotificationForDepartment,
    ).toHaveBeenCalled();
  });

  it('throws not found when inquiry detail is outside scope', async () => {
    const { prisma, service } = makeService();
    prisma.staffProfile.findFirst.mockResolvedValue(null);
    prisma.inquiry.findFirst.mockResolvedValue(null);

    await expect(
      service.getInquiry(
        { sub: 'user-1', role: 'USER', permissions: ['inquiries.view'] },
        'inq-nope',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
