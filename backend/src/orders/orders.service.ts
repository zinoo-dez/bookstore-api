import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CartService } from '../cart/cart.service';
import {
  DeliveryType,
  Order,
  OrderItem,
  OrderStatus,
  Prisma,
  PromotionCode,
  ReadingStatus,
  StaffTaskPriority,
  StaffTaskStatus,
} from '@prisma/client';
import { assertUserPermission } from '../auth/permission-resolution';
import { CreateOrderDto } from './dto/create-order.dto';
import { StaffService } from '../staff/staff.service';

type PromoPreview = {
  valid: boolean;
  promoId?: string;
  maxRedemptions?: number | null;
  code: string;
  label?: string;
  message: string;
  subtotal: number;
  discountAmount: number;
  total: number;
};

type DeliveryTask = Awaited<ReturnType<StaffService['listTasks']>>[number];

type DeliveryTaskOrderSummary = {
  id: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  shippingFullName: string | null;
  shippingEmail: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZipCode: string | null;
  shippingCountry: string | null;
  pickupStore: {
    id: string;
    code: string;
    name: string;
    city: string;
    state: string;
    address: string | null;
  } | null;
  orderItems: Array<{
    id: string;
    quantity: number;
    book: {
      id: string;
      title: string;
      author: string;
    };
  }>;
};

type DeliveryTaskWithOrder = DeliveryTask & {
  order: DeliveryTaskOrderSummary | null;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly staffService: StaffService,
  ) {}

  private async grantDigitalAccessForOrder(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            book: {
              select: {
                id: true,
                isDigital: true,
                totalPages: true,
              },
            },
          },
        },
      },
    });

    if (!order) return;

    const digitalItems = Array.from(
      new Map(
        order.orderItems
          .filter(
            (item) =>
              item.format === 'EBOOK'
              && item.book?.isDigital,
          )
          .map((item) => [item.bookId, item]),
      ).values(),
    );

    if (digitalItems.length === 0) return;

    for (const item of digitalItems) {
      const bookId = item.bookId;

      await prisma.userBookAccess.upsert({
        where: {
          userId_bookId: {
            userId: order.userId,
            bookId,
          },
        },
        update: {
          sourceOrderId: order.id,
        },
        create: {
          userId: order.userId,
          bookId,
          sourceOrderId: order.id,
        },
      });

      await prisma.readingItem.upsert({
        where: {
          userId_bookId: {
            userId: order.userId,
            bookId,
          },
        },
        update: {},
        create: {
          userId: order.userId,
          bookId,
          status: ReadingStatus.TO_READ,
          currentPage: 0,
          totalPages: item.book?.totalPages ?? null,
        },
      });
    }
  }

  private isPromoActive(rule: PromotionCode, now = new Date()): boolean {
    if (!rule.isActive) return false;
    if (rule.startsAt && now < rule.startsAt) return false;
    if (rule.endsAt && now > rule.endsAt) return false;
    if (
      rule.maxRedemptions !== null
      && rule.redeemedCount >= rule.maxRedemptions
    ) {
      return false;
    }
    return true;
  }

  private computeDiscountAmount(rule: PromotionCode, subtotal: number): number {
    const discountValue = Number(rule.discountValue);
    let amount =
      rule.discountType === 'PERCENT'
        ? subtotal * (discountValue / 100)
        : discountValue;
    if (rule.maxDiscountAmount !== null) {
      amount = Math.min(amount, Number(rule.maxDiscountAmount));
    }
    return Number(Math.max(0, Math.min(amount, subtotal)).toFixed(2));
  }

  private async evaluatePromo(
    rawCode: string,
    subtotal: number,
  ): Promise<PromoPreview> {
    const normalizedCode = rawCode.trim().toUpperCase();
    const rule = await this.prisma.promotionCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!rule) {
      return {
        valid: false,
        code: normalizedCode,
        message: 'Promo code not found.',
        subtotal,
        discountAmount: 0,
        total: subtotal,
      };
    }

    if (!this.isPromoActive(rule)) {
      return {
        valid: false,
        code: normalizedCode,
        label: rule.name,
        message: 'Promo code is not active right now.',
        subtotal,
        discountAmount: 0,
        total: subtotal,
      };
    }

    const minSubtotal = Number(rule.minSubtotal);
    if (minSubtotal > 0 && subtotal < minSubtotal) {
      return {
        valid: false,
        code: normalizedCode,
        label: rule.name,
        message: `Minimum subtotal for this promo is $${minSubtotal.toFixed(2)}.`,
        subtotal,
        discountAmount: 0,
        total: subtotal,
      };
    }

    const discountAmount = this.computeDiscountAmount(rule, subtotal);
    const total = Number((subtotal - discountAmount).toFixed(2));
    return {
      valid: true,
      promoId: rule.id,
      maxRedemptions: rule.maxRedemptions,
      code: normalizedCode,
      label: rule.name,
      message: 'Promo code applied.',
      subtotal,
      discountAmount,
      total,
    };
  }

  async validatePromo(userId: string, rawCode: string): Promise<PromoPreview> {
    const cart = await this.cartService.getCart(userId);
    const subtotal = Number(cart.totalPrice.toFixed(2));
    if (!rawCode.trim()) {
      return {
        valid: false,
        code: '',
        message: 'Promo code is required.',
        subtotal,
        discountAmount: 0,
        total: subtotal,
      };
    }
    return this.evaluatePromo(rawCode, subtotal);
  }

  private async resolveWarehouseDeliveryAssigneeStaffId() {
    const staff = await this.prisma.staffProfile.findFirst({
      where: {
        status: 'ACTIVE',
        department: {
          code: { in: ['STOCK', 'WAREHOUSE'] },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
      select: { id: true },
    });

    return staff?.id;
  }

  private async ensureDeliveryTaskForOrder(order: Order) {
    const existingTask = await this.prisma.staffTask.findFirst({
      where: {
        type: 'order-delivery',
        status: { not: StaffTaskStatus.COMPLETED },
        metadata: {
          path: ['orderId'],
          equals: order.id,
        },
      },
      select: { id: true },
    });

    if (existingTask) {
      return existingTask.id;
    }

    const assigneeStaffId =
      await this.resolveWarehouseDeliveryAssigneeStaffId();
    if (!assigneeStaffId) {
      throw new BadRequestException(
        'No active warehouse staff found. Assign at least one active stock/warehouse staff before confirming orders.',
      );
    }

    const task = await this.prisma.staffTask.create({
      data: {
        staffId: assigneeStaffId,
        type: 'order-delivery',
        status: StaffTaskStatus.TODO,
        priority: StaffTaskPriority.HIGH,
        metadata: {
          taskKind: 'ORDER_DELIVERY',
          orderId: order.id,
          orderStatus: order.status,
          totalPrice: Number(order.totalPrice),
          customerUserId: order.userId,
        },
      },
      select: { id: true },
    });

    return task.id;
  }

  private getOrderIdFromTaskMetadata(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const candidate = (metadata as { orderId?: unknown }).orderId;
    return typeof candidate === 'string' ? candidate : null;
  }

  async create(
    userId: string,
    shipping?: CreateOrderDto,
  ): Promise<Order & { orderItems: OrderItem[] }> {
    const deliveryType = shipping?.deliveryType ?? DeliveryType.HOME_DELIVERY;
    const isStorePickup = deliveryType === DeliveryType.STORE_PICKUP;
    const selectedStore = isStorePickup
      ? await this.prisma.store.findFirst({
          where: {
            id: shipping?.storeId,
            isActive: true,
          },
        })
      : null;

    if (isStorePickup && !selectedStore) {
      throw new BadRequestException(
        'An active pickup store is required for store pickup orders.',
      );
    }

    // Get user's cart
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock availability for all items and collect book prices
    const itemUnitPrices: Record<string, number> = {};
    for (const cartItem of cart.items) {
      const book = await this.prisma.book.findUnique({
        where: { id: cartItem.bookId },
      });

      if (!book) {
        throw new BadRequestException(`Book ${cartItem.bookId} not found`);
      }

      const isEbook = cartItem.format === 'EBOOK';
      if (isEbook && (!book.isDigital || !book.ebookFilePath)) {
        throw new BadRequestException(
          `Book \"${book.title}\" is not available as an eBook.`,
        );
      }

      if (isEbook && cartItem.quantity !== 1) {
        throw new BadRequestException(
          `eBook \"${book.title}\" must have quantity 1.`,
        );
      }

      if (!isEbook && !isStorePickup && book.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for book "${book.title}". Available: ${book.stock}, Requested: ${cartItem.quantity}`,
        );
      }

      itemUnitPrices[cartItem.id] = isEbook
        ? Number(book.ebookPrice ?? book.price)
        : Number(book.price);
    }

    const subtotalPrice = Number(cart.totalPrice.toFixed(2));
    let discountAmount = 0;
    let promoCode: string | null = null;
    let promoId: string | null = null;
    let promoMaxRedemptions: number | null = null;

    if (shipping?.promoCode?.trim()) {
      const promo = await this.evaluatePromo(shipping.promoCode, subtotalPrice);
      if (!promo.valid) {
        throw new BadRequestException(promo.message);
      }
      discountAmount = promo.discountAmount;
      promoCode = promo.code;
      promoId = promo.promoId ?? null;
      promoMaxRedemptions = promo.maxRedemptions ?? null;
    }

    const discountedTotal = Number((subtotalPrice - discountAmount).toFixed(2));

    // Create order with transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          deliveryType,
          storeId: selectedStore?.id ?? null,
          subtotalPrice,
          discountAmount,
          promoCode,
          totalPrice: discountedTotal,
          status: 'PENDING',
          shippingFullName: shipping?.fullName ?? null,
          shippingEmail: shipping?.email ?? null,
          shippingPhone: shipping?.phone ?? null,
          shippingAddress: isStorePickup
            ? (selectedStore?.address ?? `${selectedStore?.name ?? ''}`)
            : (shipping?.address ?? null),
          shippingCity: isStorePickup
            ? (selectedStore?.city ?? null)
            : (shipping?.city ?? null),
          shippingState: isStorePickup
            ? (selectedStore?.state ?? null)
            : (shipping?.state ?? null),
          shippingZipCode: shipping?.zipCode ?? null,
          shippingCountry: shipping?.country ?? null,
          paymentProvider: shipping?.paymentProvider,
          paymentReceiptUrl: shipping?.paymentReceiptUrl,
        },
      });

      if (promoId) {
        const updateResult = await tx.promotionCode.updateMany({
          where: {
            id: promoId,
            isActive: true,
            ...(promoMaxRedemptions !== null
              ? { redeemedCount: { lt: promoMaxRedemptions } }
              : {}),
          },
          data: {
            redeemedCount: {
              increment: 1,
            },
          },
        });

        if (updateResult.count === 0) {
          throw new BadRequestException(
            'Promo code cannot be redeemed anymore.',
          );
        }
      }

      // Create order items.
      // Inventory is managed at warehouse level and should be adjusted by
      // warehouse fulfillment workflow, not at order creation time.
      const orderItems: OrderItem[] = [];
      for (const cartItem of cart.items) {
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            bookId: cartItem.bookId,
            format: cartItem.format,
            quantity: cartItem.quantity,
            price: itemUnitPrices[cartItem.id],
          },
        });
        orderItems.push(orderItem);

        if (isStorePickup && cartItem.format !== 'EBOOK') {
          const storeStock = await tx.storeStock.findUnique({
            where: {
              storeId_bookId: {
                storeId: selectedStore!.id,
                bookId: cartItem.bookId,
              },
            },
          });

          if (!storeStock || storeStock.stock < cartItem.quantity) {
            throw new BadRequestException(
              `Pickup store stock is not enough for this item.`,
            );
          }

          await tx.storeStock.update({
            where: {
              storeId_bookId: {
                storeId: selectedStore!.id,
                bookId: cartItem.bookId,
              },
            },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          });
        }
      }

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      // Return the order with items
      return { ...order, orderItems };
    });
  }

  async findAll(userId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: { userId },
      include: {
        pickupStore: true,
        orderItems: {
          include: {
            book: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  // ADMIN: get all orders
  async findAllForAdmin(actorUserId?: string): Promise<Order[]> {
    if (actorUserId) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'finance.reports.view',
      );
    }
    return this.prisma.order.findMany({
      include: {
        pickupStore: true,
        user: true, // so admin sees who placed the order
        orderItems: {
          include: {
            book: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async findOne(userId: string, orderId: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId, // Ensure user can only access their own orders
      },
      include: {
        pickupStore: true,
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    orderId: string,
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED',
    actorUserId?: string,
  ): Promise<Order> {
    if (actorUserId) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'finance.payout.manage',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled orders cannot be updated.');
    }

    if (status === 'PENDING') {
      if (order.status === 'PENDING') {
        return order;
      }
      throw new BadRequestException(
        'You cannot move an order back to PENDING.',
      );
    }

    if (status === 'COMPLETED') {
      throw new BadRequestException(
        'Order completion must come from warehouse delivery task completion.',
      );
    }

    if (status === 'CONFIRMED' && String(order.status) !== 'PENDING') {
      throw new BadRequestException('Only PENDING orders can be confirmed.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        pickupStore: true,
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    });

    if (status === 'CONFIRMED') {
      await this.grantDigitalAccessForOrder(updated.id);
      const hasPhysicalItems = updated.orderItems.some(
        (item) => item.format !== 'EBOOK',
      );
      if (hasPhysicalItems) {
        if (updated.deliveryType === DeliveryType.HOME_DELIVERY) {
          await this.ensureDeliveryTaskForOrder(updated);
        }
      }
    }

    return updated;
  }

  async completeFromDeliveryTask(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupStore: true,
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (String(order.status) !== 'CONFIRMED') {
      throw new BadRequestException(
        'Only CONFIRMED orders can be completed from delivery tasks.',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
      include: {
        pickupStore: true,
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    });
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId, // Ensure user can only cancel their own orders
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      if (order.deliveryType === DeliveryType.STORE_PICKUP && order.storeId) {
        for (const item of order.orderItems) {
          if (item.format === 'EBOOK') {
            continue;
          }
          await tx.storeStock.upsert({
            where: {
              storeId_bookId: {
                storeId: order.storeId,
                bookId: item.bookId,
              },
            },
            update: {
              stock: {
                increment: item.quantity,
              },
            },
            create: {
              storeId: order.storeId,
              bookId: item.bookId,
              stock: item.quantity,
              lowStockThreshold: 5,
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: {
          pickupStore: true,
          orderItems: {
            include: {
              book: true,
            },
          },
        },
      });
    });
  }

  async listWarehouseDeliveryTasks(
    actorUserId: string,
    status?: StaffTaskStatus,
  ): Promise<DeliveryTask[] | DeliveryTaskWithOrder[]> {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );
    const tasks = await this.staffService.listTasks({ status }, actorUserId);
    const deliveryTasks = tasks.filter(
      (task) => task.type === 'order-delivery',
    );

    const orderIds = Array.from(
      new Set(
        deliveryTasks
          .map((task) => this.getOrderIdFromTaskMetadata(task.metadata))
          .filter((value): value is string => Boolean(value)),
      ),
    );

    if (orderIds.length === 0) {
      return deliveryTasks;
    }

    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      select: {
        id: true,
        status: true,
        deliveryType: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shippingFullName: true,
        shippingEmail: true,
        shippingPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingZipCode: true,
        shippingCountry: true,
        pickupStore: {
          select: {
            id: true,
            code: true,
            name: true,
            city: true,
            state: true,
            address: true,
          },
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
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
    });

    const ordersById = new Map(orders.map((order) => [order.id, order]));

    return deliveryTasks.map((task): DeliveryTaskWithOrder => {
      const orderId = this.getOrderIdFromTaskMetadata(task.metadata);
      return {
        ...task,
        order: orderId ? (ordersById.get(orderId) ?? null) : null,
      };
    });
  }

  async completeWarehouseDeliveryTask(taskId: string, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.receive',
    );
    const task = await this.prisma.staffTask.findUnique({
      where: { id: taskId },
      select: { id: true, type: true },
    });
    if (!task || task.type !== 'order-delivery') {
      throw new NotFoundException('Delivery task not found');
    }

    return this.staffService.completeTask(taskId, actorUserId);
  }
}
