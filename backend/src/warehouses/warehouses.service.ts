import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { SetWarehouseStockDto } from './dto/set-warehouse-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import {
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  Role,
  WarehouseAlertStatus,
} from '@prisma/client';
import {
  assertUserPermission,
  resolveUserPermissionKeys,
} from '../auth/permission-resolution';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import {
  PurchaseReviewAction,
  ReviewPurchaseRequestDto,
} from './dto/review-purchase-request.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { CreatePurchaseOrdersBatchDto } from './dto/create-purchase-orders-batch.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly purchaseOrderInclude = {
    vendor: { select: { id: true, code: true, name: true, isActive: true } },
    warehouse: { select: { id: true, code: true, name: true } },
    createdByUser: { select: { id: true, name: true, email: true } },
    approvedByUser: { select: { id: true, name: true, email: true } },
    items: {
      include: {
        book: { select: { id: true, title: true, author: true } },
      },
      orderBy: { createdAt: 'asc' as const },
    },
    request: {
      select: {
        id: true,
        status: true,
        quantity: true,
        approvedQuantity: true,
      },
    },
  };

  private async isFinanceReviewer(userId?: string) {
    if (!userId) return false;
    const keys = await resolveUserPermissionKeys(this.prisma, userId);
    return (
      keys.has('*') ||
      keys.has('finance.purchase_request.review') ||
      keys.has('finance.purchase_request.approve') ||
      keys.has('finance.purchase_request.reject')
    );
  }

  private async ensureWarehouse(warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  private async ensureBook(bookId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  private async syncBookTotalStock(bookId: string) {
    const result = await this.prisma.warehouseStock.aggregate({
      where: { bookId },
      _sum: { stock: true },
    });

    const totalStock = result._sum.stock ?? 0;
    await this.prisma.book.update({
      where: { id: bookId },
      data: { stock: totalStock },
    });

    return totalStock;
  }

  private async reconcileAllBookStocks() {
    const grouped = await this.prisma.warehouseStock.groupBy({
      by: ['bookId'],
      _sum: { stock: true },
    });

    const bookIdsWithWarehouseStock = grouped.map((row) => row.bookId);

    await this.prisma.$transaction([
      ...grouped.map((row) =>
        this.prisma.book.update({
          where: { id: row.bookId },
          data: { stock: row._sum.stock ?? 0 },
        }),
      ),
      this.prisma.book.updateMany({
        where: {
          ...(bookIdsWithWarehouseStock.length > 0
            ? { id: { notIn: bookIdsWithWarehouseStock } }
            : {}),
          stock: { not: 0 },
        },
        data: { stock: 0 },
      }),
    ]);
  }

  private async refreshLowStockAlert(warehouseId: string, bookId: string) {
    const stockRow = await this.prisma.warehouseStock.findUnique({
      where: { warehouseId_bookId: { warehouseId, bookId } },
    });

    if (!stockRow) {
      return;
    }

    const isLow = stockRow.stock <= stockRow.lowStockThreshold;

    if (isLow) {
      const existingOpen = await this.prisma.warehouseAlert.findFirst({
        where: {
          warehouseId,
          bookId,
          status: WarehouseAlertStatus.OPEN,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingOpen) {
        await this.prisma.warehouseAlert.update({
          where: { id: existingOpen.id },
          data: {
            stock: stockRow.stock,
            threshold: stockRow.lowStockThreshold,
          },
        });
      } else {
        await this.prisma.warehouseAlert.create({
          data: {
            warehouseId,
            bookId,
            stock: stockRow.stock,
            threshold: stockRow.lowStockThreshold,
            status: WarehouseAlertStatus.OPEN,
          },
        });
      }
    } else {
      await this.prisma.warehouseAlert.updateMany({
        where: {
          warehouseId,
          bookId,
          status: WarehouseAlertStatus.OPEN,
        },
        data: {
          status: WarehouseAlertStatus.RESOLVED,
          resolvedAt: new Date(),
          stock: stockRow.stock,
          threshold: stockRow.lowStockThreshold,
        },
      });
    }
  }

  async listWarehouses() {
    // Keep aggregate book stock consistent with warehouse-level stock rows.
    await this.reconcileAllBookStocks();

    return this.prisma.warehouse.findMany({
      include: {
        _count: {
          select: {
            stocks: true,
            alerts: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async getBookStockPresence() {
    const [totalWarehouses, grouped] = await Promise.all([
      this.prisma.warehouse.count({
        where: { isActive: true },
      }),
      this.prisma.warehouseStock.groupBy({
        by: ['bookId'],
        _count: { warehouseId: true },
      }),
    ]);

    return {
      totalWarehouses,
      byBook: grouped.map((row) => ({
        bookId: row.bookId,
        warehouseCount: row._count.warehouseId ?? 0,
      })),
    };
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code,
        city: dto.city,
        state: dto.state,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateWarehouse(warehouseId: string, dto: UpdateWarehouseDto) {
    await this.ensureWarehouse(warehouseId);

    return this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteWarehouse(warehouseId: string) {
    await this.ensureWarehouse(warehouseId);

    const stockSummary = await this.prisma.warehouseStock.aggregate({
      where: { warehouseId },
      _sum: { stock: true },
    });

    if ((stockSummary._sum.stock ?? 0) > 0) {
      throw new BadRequestException(
        'Warehouse still has stock. Transfer or clear stock before deleting.',
      );
    }

    return this.prisma.warehouse.delete({ where: { id: warehouseId } });
  }

  async getWarehouseStocks(warehouseId: string) {
    await this.ensureWarehouse(warehouseId);

    return this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: {
        book: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async setWarehouseStock(
    warehouseId: string,
    bookId: string,
    dto: SetWarehouseStockDto,
    actorUserId?: string,
  ) {
    if (actorUserId) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'warehouse.stock.update',
      );
    }

    await this.ensureWarehouse(warehouseId);
    await this.ensureBook(bookId);

    const row = await this.prisma.warehouseStock.upsert({
      where: { warehouseId_bookId: { warehouseId, bookId } },
      update: {
        stock: dto.stock,
        ...(dto.lowStockThreshold !== undefined
          ? { lowStockThreshold: dto.lowStockThreshold }
          : {}),
      },
      create: {
        warehouseId,
        bookId,
        stock: dto.stock,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
      },
      include: { book: true, warehouse: true },
    });

    const totalBookStock = await this.syncBookTotalStock(bookId);
    await this.refreshLowStockAlert(warehouseId, bookId);

    return {
      ...row,
      totalBookStock,
    };
  }

  async transferStock(dto: TransferStockDto, actorUserId?: string) {
    if (actorUserId) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'warehouse.transfer',
      );
    }

    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse must be different',
      );
    }

    await this.ensureWarehouse(dto.fromWarehouseId);
    await this.ensureWarehouse(dto.toWarehouseId);
    await this.ensureBook(dto.bookId);

    const transfer = await this.prisma.$transaction(async (tx) => {
      const source = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.fromWarehouseId,
            bookId: dto.bookId,
          },
        },
      });

      if (!source || source.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock in source warehouse');
      }

      const target = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.toWarehouseId,
            bookId: dto.bookId,
          },
        },
      });

      await tx.warehouseStock.update({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.fromWarehouseId,
            bookId: dto.bookId,
          },
        },
        data: {
          stock: source.stock - dto.quantity,
        },
      });

      if (target) {
        await tx.warehouseStock.update({
          where: {
            warehouseId_bookId: {
              warehouseId: dto.toWarehouseId,
              bookId: dto.bookId,
            },
          },
          data: {
            stock: target.stock + dto.quantity,
          },
        });
      } else {
        await tx.warehouseStock.create({
          data: {
            warehouseId: dto.toWarehouseId,
            bookId: dto.bookId,
            stock: dto.quantity,
            lowStockThreshold: 5,
          },
        });
      }

      return tx.warehouseTransfer.create({
        data: {
          bookId: dto.bookId,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          quantity: dto.quantity,
          note: dto.note,
          createdByUserId: actorUserId,
        },
        include: {
          book: true,
          fromWarehouse: true,
          toWarehouse: true,
        },
      });
    });

    await this.syncBookTotalStock(dto.bookId);
    await this.refreshLowStockAlert(dto.fromWarehouseId, dto.bookId);
    await this.refreshLowStockAlert(dto.toWarehouseId, dto.bookId);

    return transfer;
  }

  async listLowStockAlerts(
    status: WarehouseAlertStatus = WarehouseAlertStatus.OPEN,
  ) {
    return this.prisma.warehouseAlert.findMany({
      where: { status },
      include: {
        warehouse: true,
        book: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  async listTransfers(limit = 50) {
    return this.prisma.warehouseTransfer.findMany({
      include: {
        book: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async listPurchaseRequests(
    actorUserId: string,
    filters?: { status?: PurchaseRequestStatus; warehouseId?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const canViewAll =
      user.role === Role.ADMIN ||
      String(user.role) === 'SUPER_ADMIN' ||
      (await this.isFinanceReviewer(actorUserId));

    return this.prisma.purchaseRequest.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.warehouseId ? { warehouseId: filters.warehouseId } : {}),
        ...(canViewAll ? {} : { requestedByUserId: actorUserId }),
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, name: true, email: true } },
        approvedByUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });
  }

  async listVendors(activeOnly?: boolean) {
    return this.prisma.vendor.findMany({
      where: {
        ...(activeOnly === undefined ? {} : { isActive: activeOnly }),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      take: 200,
    });
  }

  async createVendor(dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateVendor(vendorId: string, dto: UpdateVendorDto) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(dto.code !== undefined ? { code: dto.code.toUpperCase() } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.contactName !== undefined ? { contactName: dto.contactName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteVendor(vendorId: string) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }

    const linkedOrders = await this.prisma.purchaseOrder.count({
      where: { vendorId },
    });

    if (linkedOrders > 0) {
      throw new BadRequestException(
        'Vendor cannot be deleted because it is linked to purchase orders. Set vendor to inactive instead.',
      );
    }

    return this.prisma.vendor.delete({
      where: { id: vendorId },
    });
  }

  async listPurchaseOrders(
    actorUserId: string,
    filters?: {
      status?: PurchaseOrderStatus;
      warehouseId?: string;
      vendorId?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const canViewAll =
      user.role === Role.ADMIN ||
      String(user.role) === 'SUPER_ADMIN' ||
      (await this.isFinanceReviewer(actorUserId));

    return this.prisma.purchaseOrder.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.warehouseId ? { warehouseId: filters.warehouseId } : {}),
        ...(filters?.vendorId ? { vendorId: filters.vendorId } : {}),
        ...(canViewAll ? {} : { createdByUserId: actorUserId }),
      },
      include: this.purchaseOrderInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: dto.purchaseRequestId },
      select: {
        id: true,
        status: true,
        purchaseOrderId: true,
        warehouseId: true,
        bookId: true,
        quantity: true,
        approvedQuantity: true,
        approvedCost: true,
        estimatedCost: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (request.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Purchase order can only be created from approved request.',
      );
    }
    if (request.purchaseOrderId) {
      throw new BadRequestException(
        'Purchase request already has a linked purchase order.',
      );
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      select: { id: true, isActive: true },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    if (!vendor.isActive) {
      throw new BadRequestException('Vendor is inactive.');
    }

    const orderedQuantity = request.approvedQuantity ?? request.quantity;
    const unitCost =
      dto.unitCost ??
      Number(request.approvedCost ?? request.estimatedCost ?? 0);
    const totalCost = unitCost > 0 ? unitCost * orderedQuantity : undefined;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          vendorId: dto.vendorId,
          warehouseId: request.warehouseId,
          status: PurchaseOrderStatus.SENT,
          createdByUserId: actorUserId,
          approvedByUserId: actorUserId,
          expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
          sentAt: new Date(),
          notes: dto.notes,
          totalCost,
          items: {
            create: {
              bookId: request.bookId,
              orderedQuantity,
              unitCost: unitCost > 0 ? unitCost : null,
            },
          },
        },
        include: this.purchaseOrderInclude,
      });

      await tx.purchaseRequest.update({
        where: { id: request.id },
        data: { purchaseOrderId: order.id },
      });

      return order;
    });
  }

  async createPurchaseOrdersBatch(
    dto: CreatePurchaseOrdersBatchDto,
    actorUserId: string,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );

    const uniqueIds = Array.from(new Set(dto.purchaseRequestIds));
    if (uniqueIds.length === 0) {
      throw new BadRequestException(
        'At least one purchase request is required.',
      );
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      select: { id: true, isActive: true },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    if (!vendor.isActive) {
      throw new BadRequestException('Vendor is inactive.');
    }

    const requests = await this.prisma.purchaseRequest.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        status: true,
        purchaseOrderId: true,
        warehouseId: true,
        bookId: true,
        quantity: true,
        approvedQuantity: true,
        approvedCost: true,
        estimatedCost: true,
      },
    });

    if (requests.length !== uniqueIds.length) {
      throw new NotFoundException(
        'One or more purchase requests were not found.',
      );
    }

    const invalid = requests.filter(
      (request) =>
        request.status !== PurchaseRequestStatus.APPROVED ||
        !!request.purchaseOrderId,
    );
    if (invalid.length > 0) {
      throw new BadRequestException(
        'All requests must be APPROVED and not already linked to a purchase order.',
      );
    }

    const createdOrders = await this.prisma.$transaction(async (tx) => {
      const orders = [];

      for (const request of requests) {
        const orderedQuantity = request.approvedQuantity ?? request.quantity;
        const unitCost =
          dto.unitCost ??
          Number(request.approvedCost ?? request.estimatedCost ?? 0);
        const totalCost = unitCost > 0 ? unitCost * orderedQuantity : undefined;

        const order = await tx.purchaseOrder.create({
          data: {
            vendorId: dto.vendorId,
            warehouseId: request.warehouseId,
            status: PurchaseOrderStatus.SENT,
            createdByUserId: actorUserId,
            approvedByUserId: actorUserId,
            expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
            sentAt: new Date(),
            notes: dto.notes,
            totalCost,
            items: {
              create: {
                bookId: request.bookId,
                orderedQuantity,
                unitCost: unitCost > 0 ? unitCost : null,
              },
            },
          },
          include: this.purchaseOrderInclude,
        });

        await tx.purchaseRequest.update({
          where: { id: request.id },
          data: { purchaseOrderId: order.id },
        });

        orders.push(order);
      }

      return orders;
    });

    return {
      createdCount: createdOrders.length,
      orders: createdOrders,
    };
  }

  async receivePurchaseOrder(
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
    actorUserId: string,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.receive',
    );

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: true,
        request: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }
    if (
      order.status === PurchaseOrderStatus.CLOSED ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Purchase order is closed and cannot receive stock.',
      );
    }
    if (order.items.length === 0) {
      throw new BadRequestException('Purchase order has no items.');
    }

    const receiveMap = new Map<string, number>();
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        receiveMap.set(item.itemId, item.receivedQuantity);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const remaining = item.orderedQuantity - item.receivedQuantity;
        if (remaining <= 0) {
          continue;
        }

        const incoming =
          receiveMap.size > 0 ? (receiveMap.get(item.id) ?? 0) : remaining;

        if (incoming <= 0) {
          continue;
        }
        if (incoming > remaining) {
          throw new BadRequestException(
            'Received quantity exceeds ordered quantity.',
          );
        }

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQuantity: item.receivedQuantity + incoming,
          },
        });

        const existingStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_bookId: {
              warehouseId: order.warehouseId,
              bookId: item.bookId,
            },
          },
        });

        if (existingStock) {
          await tx.warehouseStock.update({
            where: {
              warehouseId_bookId: {
                warehouseId: order.warehouseId,
                bookId: item.bookId,
              },
            },
            data: {
              stock: existingStock.stock + incoming,
            },
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              warehouseId: order.warehouseId,
              bookId: item.bookId,
              stock: incoming,
              lowStockThreshold: 5,
            },
          });
        }
      }

      const freshItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: order.id },
      });
      const fullyReceived = freshItems.every(
        (item) => item.receivedQuantity >= item.orderedQuantity,
      );

      const nextStatus = fullyReceived
        ? (dto.closeWhenFullyReceived ?? true)
          ? PurchaseOrderStatus.CLOSED
          : PurchaseOrderStatus.RECEIVED
        : PurchaseOrderStatus.PARTIALLY_RECEIVED;

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          receivedAt: fullyReceived ? new Date() : null,
          notes: dto.note
            ? `${order.notes ? `${order.notes}\n` : ''}${dto.note}`
            : order.notes,
        },
      });

      if (
        fullyReceived &&
        order.request &&
        order.request.status === PurchaseRequestStatus.APPROVED
      ) {
        await tx.purchaseRequest.update({
          where: { id: order.request.id },
          data: {
            status: PurchaseRequestStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
      }
    });

    for (const item of order.items) {
      await this.syncBookTotalStock(item.bookId);
      await this.refreshLowStockAlert(order.warehouseId, item.bookId);
    }

    return this.prisma.purchaseOrder.findUnique({
      where: { id: order.id },
      include: this.purchaseOrderInclude,
    });
  }

  async createPurchaseRequest(
    dto: CreatePurchaseRequestDto,
    actorUserId: string,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.view',
    );
    await this.ensureWarehouse(dto.warehouseId);
    await this.ensureBook(dto.bookId);

    return this.prisma.purchaseRequest.create({
      data: {
        bookId: dto.bookId,
        warehouseId: dto.warehouseId,
        requestedByUserId: actorUserId,
        quantity: dto.quantity,
        estimatedCost: dto.estimatedCost,
        reviewNote: dto.reviewNote,
        status:
          dto.submitForApproval === false
            ? PurchaseRequestStatus.DRAFT
            : PurchaseRequestStatus.PENDING_APPROVAL,
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, name: true, email: true } },
        approvedByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async submitPurchaseRequest(requestId: string, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.create',
    );

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: { id: true, requestedByUserId: true, status: true },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (request.requestedByUserId !== actorUserId) {
      throw new ForbiddenException(
        'You can only submit your own purchase requests.',
      );
    }
    if (request.status !== PurchaseRequestStatus.DRAFT) {
      throw new BadRequestException('Only draft requests can be submitted.');
    }

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.PENDING_APPROVAL },
    });
  }

  async reviewPurchaseRequest(
    requestId: string,
    dto: ReviewPurchaseRequestDto,
    actorUserId: string,
  ) {
    if (dto.action === PurchaseReviewAction.APPROVE) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'finance.purchase_request.approve',
      );
    } else {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'finance.purchase_request.reject',
      );
    }

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, quantity: true, estimatedCost: true },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (request.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending requests can be reviewed.');
    }

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status:
          dto.action === PurchaseReviewAction.APPROVE
            ? PurchaseRequestStatus.APPROVED
            : PurchaseRequestStatus.REJECTED,
        approvedQuantity:
          dto.action === PurchaseReviewAction.APPROVE
            ? (dto.approvedQuantity ?? request.quantity)
            : null,
        approvedCost:
          dto.action === PurchaseReviewAction.APPROVE
            ? (dto.approvedCost ?? request.estimatedCost ?? null)
            : null,
        reviewNote: dto.reviewNote,
        approvedByUserId: actorUserId,
        approvedAt: new Date(),
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, name: true, email: true } },
        approvedByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async completePurchaseRequest(requestId: string, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.complete',
    );

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, requestedByUserId: true },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (request.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be completed.');
    }

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: PurchaseRequestStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, name: true, email: true } },
        approvedByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
