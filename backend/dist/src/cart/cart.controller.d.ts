import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    addItem(req: any, dto: AddToCartDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        bookId: string;
        quantity: number;
        userId: string;
    }>;
    updateItem(req: any, bookId: string, dto: UpdateCartItemDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        bookId: string;
        quantity: number;
        userId: string;
    }>;
    removeItem(req: any, bookId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        bookId: string;
        quantity: number;
        userId: string;
    }>;
    getCart(req: any): Promise<{
        items: import(".prisma/client").CartItem[];
        totalPrice: number;
    }>;
}
