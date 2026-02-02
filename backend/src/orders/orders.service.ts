import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { Order, OrderItem } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async create(userId: string): Promise<Order & { orderItems: OrderItem[] }> {
    // Get user's cart
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock availability for all items and collect book prices
    const bookPrices: Record<string, number> = {};
    for (const cartItem of cart.items) {
      const book = await this.prisma.book.findUnique({
        where: { id: cartItem.bookId },
      });

      if (!book) {
        throw new BadRequestException(`Book ${cartItem.bookId} not found`);
      }

      if (book.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for book "${book.title}". Available: ${book.stock}, Requested: ${cartItem.quantity}`,
        );
      }

      bookPrices[cartItem.bookId] = Number(book.price);
    }

    // Create order with transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          totalPrice: cart.totalPrice,
          status: 'PENDING',
        },
      });

      // Create order items and reduce stock
      const orderItems: OrderItem[] = [];
      for (const cartItem of cart.items) {
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            bookId: cartItem.bookId,
            quantity: cartItem.quantity,
            price: bookPrices[cartItem.bookId],
          },
        });
        orderItems.push(orderItem);

        // Reduce book stock
        await tx.book.update({
          where: { id: cartItem.bookId },
          data: {
            stock: {
              decrement: cartItem.quantity,
            },
          },
        });
      }

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      // Update order status to COMPLETED
      const completedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
        include: { orderItems: true },
      });

      return completedOrder;
    });
  }

  async findAll(userId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            book: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, orderId: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId, // Ensure user can only access their own orders
      },
      include: {
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
}