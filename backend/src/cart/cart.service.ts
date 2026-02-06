import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addItem(userId: string, dto: AddToCartDto): Promise<CartItem> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user session. Please login again.');
    }

    // Check if book exists and has sufficient stock
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Check if item already exists in cart
    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId: dto.bookId,
        },
      },
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + dto.quantity;
      
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
          quantity: dto.quantity,
        },
        include: { book: true },
      });
    }
  }

  async updateItem(userId: string, bookId: string, dto: UpdateCartItemDto): Promise<CartItem> {
    // Check if book exists and has sufficient stock
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Find existing cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
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

  async removeItem(userId: string, bookId: string): Promise<CartItem> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
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

  async getCart(userId: string): Promise<{ items: CartItem[]; totalPrice: number }> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { book: true },
    });

    const totalPrice = cartItems.reduce((total, item) => {
      return total + (Number(item.book.price) * item.quantity);
    }, 0);

    return {
      items: cartItems,
      totalPrice: Number(totalPrice.toFixed(2)),
    };
  }

  async clearCart(userId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }
}