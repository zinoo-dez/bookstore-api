import { PrismaService } from '../database/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from '@prisma/client';
export declare class CartService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addItem(userId: string, dto: AddToCartDto): Promise<CartItem>;
    updateItem(userId: string, bookId: string, dto: UpdateCartItemDto): Promise<CartItem>;
    removeItem(userId: string, bookId: string): Promise<CartItem>;
    getCart(userId: string): Promise<{
        items: CartItem[];
        totalPrice: number;
    }>;
    clearCart(userId: string): Promise<void>;
}
