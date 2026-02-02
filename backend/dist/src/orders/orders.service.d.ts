import { PrismaService } from '../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { Order, OrderItem } from '@prisma/client';
export declare class OrdersService {
    private readonly prisma;
    private readonly cartService;
    constructor(prisma: PrismaService, cartService: CartService);
    create(userId: string): Promise<Order & {
        orderItems: OrderItem[];
    }>;
    findAll(userId: string): Promise<Order[]>;
    findOne(userId: string, orderId: string): Promise<Order>;
}
