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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let CartService = class CartService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addItem(userId, dto) {
        const book = await this.prisma.book.findUnique({
            where: { id: dto.bookId },
        });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        if (book.stock < dto.quantity) {
            throw new common_1.BadRequestException('Insufficient stock available');
        }
        const existingCartItem = await this.prisma.cartItem.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId: dto.bookId,
                },
            },
        });
        if (existingCartItem) {
            const newQuantity = existingCartItem.quantity + dto.quantity;
            if (book.stock < newQuantity) {
                throw new common_1.BadRequestException('Insufficient stock available');
            }
            return await this.prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: { quantity: newQuantity },
                include: { book: true },
            });
        }
        else {
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
    async updateItem(userId, bookId, dto) {
        const book = await this.prisma.book.findUnique({
            where: { id: bookId },
        });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        if (book.stock < dto.quantity) {
            throw new common_1.BadRequestException('Insufficient stock available');
        }
        const cartItem = await this.prisma.cartItem.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId,
                },
            },
        });
        if (!cartItem) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        return await this.prisma.cartItem.update({
            where: { id: cartItem.id },
            data: { quantity: dto.quantity },
            include: { book: true },
        });
    }
    async removeItem(userId, bookId) {
        const cartItem = await this.prisma.cartItem.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId,
                },
            },
        });
        if (!cartItem) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        return await this.prisma.cartItem.delete({
            where: { id: cartItem.id },
            include: { book: true },
        });
    }
    async getCart(userId) {
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
    async clearCart(userId) {
        await this.prisma.cartItem.deleteMany({
            where: { userId },
        });
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map