"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const cart_service_1 = require("../cart/cart.service");
let OrdersService = class OrdersService {
    prisma;
    cartService;
    constructor(prisma, cartService) {
        this.prisma = prisma;
        this.cartService = cartService;
    }
    async create(userId) {
        const cart = await this.cartService.getCart(userId);
        if (!cart.items || cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const bookPrices = {};
        for (const cartItem of cart.items) {
            const book = await this.prisma.book.findUnique({
                where: { id: cartItem.bookId },
            });
            if (!book) {
                throw new common_1.BadRequestException(`Book ${cartItem.bookId} not found`);
            }
            if (book.stock < cartItem.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for book "${book.title}". Available: ${book.stock}, Requested: ${cartItem.quantity}`);
            }
            bookPrices[cartItem.bookId] = Number(book.price);
        }
        return await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice: cart.totalPrice,
                    status: 'PENDING',
                },
            });
            const orderItems = [];
            for (const cartItem of cart.items) {
                const orderItem = await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        bookId: cartItem.bookId,
                        quantity: cartItem.quantity,
                        price: bookPrices[cartItem.bookId],
                    },
                });
                orderItems.push(orderItem);
                await tx.book.update({
                    where: { id: cartItem.bookId },
                    data: {
                        stock: {
                            decrement: cartItem.quantity,
                        },
                    },
                });
            }
            await tx.cartItem.deleteMany({
                where: { userId },
            });
            const completedOrder = await tx.order.update({
                where: { id: order.id },
                data: { status: 'COMPLETED' },
                include: { orderItems: true },
            });
            return completedOrder;
        });
    }
    async findAll(userId) {
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
    async findOne(userId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
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
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cart_service_1.CartService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map