import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BookPurchaseFormat, CartItem } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveBookUnitPrice(
    book: { price: any; ebookPrice: any | null },
    format: BookPurchaseFormat,
  ) {
    if (format === BookPurchaseFormat.EBOOK) {
      return Number(book.ebookPrice ?? book.price);
    }
    return Number(book.price);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartItem> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }

    // Check if book exists and has sufficient stock
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const format = dto.format ?? BookPurchaseFormat.PHYSICAL;
    if (format === BookPurchaseFormat.EBOOK) {
      if (!book.isDigital || !book.ebookFilePath) {
        throw new BadRequestException('This title is not available as an eBook.');
      }
      if (dto.quantity !== 1) {
        throw new BadRequestException('eBook quantity must be 1.');
      }
    }

    if (format === BookPurchaseFormat.PHYSICAL && book.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Check if item already exists in cart
    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_bookId_format: {
          userId,
          bookId: dto.bookId,
          format,
        },
      },
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + dto.quantity;

      if (format === BookPurchaseFormat.EBOOK) {
        throw new BadRequestException('eBook is already in your cart.');
      }

      if (book.stock < newQuantity) {
        throw new BadRequestException('Insufficient stock available');
      }

      return await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: { book: true },
      });
    } else {
      // Create new cart item
      return await this.prisma.cartItem.create({
        data: {
          userId,
          bookId: dto.bookId,
          format,
          quantity: dto.quantity,
        },
        include: { book: true },
      });
    }
  }

  async updateItem(
    userId: string,
    bookId: string,
    format: BookPurchaseFormat,
    dto: UpdateCartItemDto,
  ): Promise<CartItem> {
    // Check if book exists and has sufficient stock
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (format === BookPurchaseFormat.EBOOK) {
      if (dto.quantity !== 1) {
        throw new BadRequestException('eBook quantity must be 1.');
      }
      if (!book.isDigital || !book.ebookFilePath) {
        throw new BadRequestException('This title is not available as an eBook.');
      }
    }

    if (format === BookPurchaseFormat.PHYSICAL && book.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Find existing cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_bookId_format: {
          userId,
          bookId,
          format,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return await this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: dto.quantity },
      include: { book: true },
    });
  }

  async removeItem(
    userId: string,
    bookId: string,
    format: BookPurchaseFormat,
  ): Promise<CartItem> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_bookId_format: {
          userId,
          bookId,
          format,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
      include: { book: true },
    });
  }

  async getCart(
    userId: string,
  ): Promise<{ items: Array<CartItem & { unitPrice: number }>; totalPrice: number }> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { book: true },
    });

    const items = cartItems.map((item) => {
      const unitPrice = this.resolveBookUnitPrice(item.book, item.format);
      return {
        ...item,
        unitPrice,
      };
    });

    const totalPrice = items.reduce((total, item) => {
      return total + item.unitPrice * item.quantity;
    }, 0);

    return {
      items,
      totalPrice: Number(totalPrice.toFixed(2)),
    };
  }

  async clearCart(userId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }
}
