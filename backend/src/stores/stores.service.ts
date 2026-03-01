import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SetStoreStockDto } from './dto/set-store-stock.dto';
import { TransferToStoreDto } from './dto/transfer-to-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  private async ensureBook(bookId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
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

  private async syncBookTotalStockFromWarehouses(bookId: string) {
    const aggregate = await this.prisma.warehouseStock.aggregate({
      where: { bookId },
      _sum: { stock: true },
    });
    await this.prisma.book.update({
      where: { id: bookId },
      data: {
        stock: aggregate._sum.stock ?? 0,
      },
    });
  }

  async listPublicStores() {
    return this.prisma.store.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        state: true,
        address: true,
        phone: true,
        email: true,
      },
      orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
    });
  }

  async listStores(
    actorUserId: string,
    status: 'active' | 'trashed' | 'all' = 'active',
  ) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.view');
    return this.prisma.store.findMany({
      where:
        status === 'all'
          ? {}
          : status === 'trashed'
            ? { deletedAt: { not: null } }
            : { deletedAt: null },
      include: {
        _count: {
          select: {
            stocks: true,
            orders: true,
            inboundTransfers: true,
          },
        },
      },
      orderBy: [{ deletedAt: 'asc' }, { isActive: 'desc' }, { state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
    });
  }

  async createStore(dto: CreateStoreDto, actorUserId: string) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.stock.update');
    return this.prisma.store.create({
      data: {
        name: dto.name,
        code: dto.code,
        city: dto.city,
        state: dto.state,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateStore(storeId: string, dto: UpdateStoreDto, actorUserId: string) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.stock.update');
    const store = await this.ensureStore(storeId);
    if (store.deletedAt) {
      throw new BadRequestException('Cannot update a store in bin. Restore it first.');
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteStore(storeId: string, actorUserId: string) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.stock.update');
    const store = await this.ensureStore(storeId);
    if (store.deletedAt) {
      throw new BadRequestException('Store is already in bin.');
    }

    const [stockSummary, activeOrders] = await Promise.all([
      this.prisma.storeStock.aggregate({
        where: { storeId },
        _sum: { stock: true },
      }),
      this.prisma.order.count({
        where: {
          storeId,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
          },
        },
      }),
    ]);

    if ((stockSummary._sum.stock ?? 0) > 0) {
      throw new BadRequestException(
        'Cannot delete store while stock exists. Move or clear stock first.',
      );
    }

    if (activeOrders > 0) {
      throw new BadRequestException(
        'Cannot delete store while active pickup orders exist.',
      );
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async restoreStore(storeId: string, actorUserId: string) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.stock.update');
    const store = await this.ensureStore(storeId);
    if (!store.deletedAt) {
      throw new BadRequestException('Store is not in bin.');
    }
    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        deletedAt: null,
      },
    });
  }

  async permanentDeleteStore(storeId: string, actorUserId: string) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.stock.update');
    const store = await this.ensureStore(storeId);
    if (!store.deletedAt) {
      throw new BadRequestException(
        'Store must be moved to bin before permanent delete.',
      );
    }
    return this.prisma.store.delete({
      where: { id: storeId },
    });
  }

  async getStoreStocks(storeId: string, actorUserId: string) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.view');
    await this.ensureStore(storeId);

    return this.prisma.storeStock.findMany({
      where: { storeId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            price: true,
          },
        },
      },
      orderBy: [{ stock: 'asc' }, { book: { title: 'asc' } }],
    });
  }

  async setStoreStock(
    storeId: string,
    bookId: string,
    dto: SetStoreStockDto,
    actorUserId: string,
  ) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.stock.update');
    await this.ensureStore(storeId);
    await this.ensureBook(bookId);

    return this.prisma.storeStock.upsert({
      where: {
        storeId_bookId: {
          storeId,
          bookId,
        },
      },
      update: {
        stock: dto.stock,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
      },
      create: {
        storeId,
        bookId,
        stock: dto.stock,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
      },
    });
  }

  async transferFromWarehouse(dto: TransferToStoreDto, actorUserId: string) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.transfer');

    const [, targetStore] = await Promise.all([
      this.ensureWarehouse(dto.fromWarehouseId),
      this.ensureStore(dto.toStoreId),
      this.ensureBook(dto.bookId),
    ]);
    if (targetStore.deletedAt || !targetStore.isActive) {
      throw new BadRequestException(
        'Destination store must be active and not in bin.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const source = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.fromWarehouseId,
            bookId: dto.bookId,
          },
        },
      });

      if (!source || source.stock < dto.quantity) {
        throw new BadRequestException('Insufficient source warehouse stock.');
      }

      await tx.warehouseStock.update({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.fromWarehouseId,
            bookId: dto.bookId,
          },
        },
        data: {
          stock: {
            decrement: dto.quantity,
          },
        },
      });

      await tx.storeStock.upsert({
        where: {
          storeId_bookId: {
            storeId: dto.toStoreId,
            bookId: dto.bookId,
          },
        },
        update: {
          stock: {
            increment: dto.quantity,
          },
        },
        create: {
          storeId: dto.toStoreId,
          bookId: dto.bookId,
          stock: dto.quantity,
          lowStockThreshold: 5,
        },
      });

      const transfer = await tx.storeTransfer.create({
        data: {
          bookId: dto.bookId,
          fromWarehouseId: dto.fromWarehouseId,
          toStoreId: dto.toStoreId,
          quantity: dto.quantity,
          note: dto.note,
          createdByUserId: actorUserId,
        },
        include: {
          book: {
            select: { id: true, title: true, author: true },
          },
          fromWarehouse: {
            select: { id: true, code: true, name: true },
          },
          toStore: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      return transfer;
    }).then(async (transfer) => {
      await this.syncBookTotalStockFromWarehouses(dto.bookId);
      return transfer;
    });
  }

  async listTransfers(actorUserId: string, limit = 50) {
    await assertUserPermission(this.prisma, actorUserId, 'warehouse.view');
    const safeLimit = Number.isNaN(limit) ? 50 : Math.min(Math.max(limit, 1), 200);
    return this.prisma.storeTransfer.findMany({
      take: safeLimit,
      include: {
        book: {
          select: { id: true, title: true, author: true },
        },
        fromWarehouse: {
          select: { id: true, code: true, name: true },
        },
        toStore: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSalesOverview(actorUserId: string, from?: Date, to?: Date) {
    await assertUserPermission(this.prisma, actorUserId, 'finance.reports.view');

    const where = {
      deliveryType: 'STORE_PICKUP' as const,
      status: {
        in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED],
      },
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [orders, stores] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          pickupStore: {
            select: {
              id: true,
              code: true,
              name: true,
              city: true,
              state: true,
            },
          },
          orderItems: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.store.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
          state: true,
          isActive: true,
        },
      }),
    ]);

    const byStore = new Map<string, {
      store: {
        id: string;
        code: string;
        name: string;
        city: string;
        state: string;
      };
      totalOrders: number;
      completedOrders: number;
      grossSales: number;
      unitsSold: number;
      topBooks: Map<string, { bookId: string; title: string; author: string; quantity: number }>;
    }>();

    for (const order of orders) {
      if (!order.pickupStore) {
        continue;
      }

      const current = byStore.get(order.pickupStore.id) ?? {
        store: order.pickupStore,
        totalOrders: 0,
        completedOrders: 0,
        grossSales: 0,
        unitsSold: 0,
        topBooks: new Map(),
      };

      current.totalOrders += 1;
      if (order.status === OrderStatus.COMPLETED) {
        current.completedOrders += 1;
      }
      current.grossSales += Number(order.totalPrice);

      for (const item of order.orderItems) {
        current.unitsSold += item.quantity;
        const existing = current.topBooks.get(item.bookId) ?? {
          bookId: item.bookId,
          title: item.book.title,
          author: item.book.author,
          quantity: 0,
        };
        existing.quantity += item.quantity;
        current.topBooks.set(item.bookId, existing);
      }

      byStore.set(order.pickupStore.id, current);
    }

    const perStore = stores.map((store) => {
      const stats = byStore.get(store.id);
      const grossSales = Number((stats?.grossSales ?? 0).toFixed(2));
      const totalOrders = stats?.totalOrders ?? 0;
      return {
        store,
        totalOrders,
        completedOrders: stats?.completedOrders ?? 0,
        unitsSold: stats?.unitsSold ?? 0,
        grossSales,
        avgOrderValue: totalOrders > 0 ? Number((grossSales / totalOrders).toFixed(2)) : 0,
        topBooks: stats
          ? Array.from(stats.topBooks.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)
          : [],
      };
    });

    const totalSales = Number(
      perStore.reduce((sum, item) => sum + item.grossSales, 0).toFixed(2),
    );
    const totalOrders = perStore.reduce((sum, item) => sum + item.totalOrders, 0);

    return {
      range: {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
      },
      totals: {
        stores: stores.length,
        activeStores: stores.filter((store) => store.isActive).length,
        orders: totalOrders,
        grossSales: totalSales,
        avgOrderValue: totalOrders > 0 ? Number((totalSales / totalOrders).toFixed(2)) : 0,
      },
      perStore: perStore.sort((a, b) => b.grossSales - a.grossSales),
    };
  }
}
