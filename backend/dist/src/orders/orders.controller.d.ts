import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        userId: string;
    } & {
        orderItems: import(".prisma/client").OrderItem[];
    }>;
    findAll(req: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        userId: string;
    }[]>;
    findOne(req: any, id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        userId: string;
    }>;
}
