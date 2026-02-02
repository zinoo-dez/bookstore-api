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
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let BooksService = class BooksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateStockStatus(stock) {
        if (stock === 0) {
            return 'OUT_OF_STOCK';
        }
        else if (stock <= 5) {
            return 'LOW_STOCK';
        }
        else {
            return 'IN_STOCK';
        }
    }
    enhanceBookWithStockStatus(book) {
        const stockStatus = this.calculateStockStatus(book.stock);
        return {
            ...book,
            inStock: book.stock > 0,
            stockStatus,
        };
    }
    enhanceBooksWithStockStatus(books) {
        return books.map(book => this.enhanceBookWithStockStatus(book));
    }
    async findAll(searchDto) {
        const { title, author, isbn, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = searchDto || {};
        const where = {};
        if (title) {
            where.title = { contains: title, mode: 'insensitive' };
        }
        if (author) {
            where.author = { contains: author, mode: 'insensitive' };
        }
        if (isbn) {
            where.isbn = { contains: isbn, mode: 'insensitive' };
        }
        const skip = (page - 1) * limit;
        const [books, total] = await Promise.all([
            this.prisma.book.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.book.count({ where }),
        ]);
        if (total === 0) {
            return {
                message: 'No books found matching your search',
                books: [],
                total,
                page,
                limit,
            };
        }
        return {
            books: this.enhanceBooksWithStockStatus(books),
            total,
            page,
            limit,
        };
    }
    async findOne(id) {
        const book = await this.prisma.book.findUnique({
            where: { id },
        });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        return this.enhanceBookWithStockStatus(book);
    }
    async create(dto) {
        const book = await this.prisma.book.create({
            data: dto,
        });
        return this.enhanceBookWithStockStatus(book);
    }
    async update(id, dto) {
        const existingBook = await this.findOne(id);
        const book = await this.prisma.book.update({
            where: { id },
            data: dto,
        });
        return this.enhanceBookWithStockStatus(book);
    }
    async remove(id) {
        const existingBook = await this.findOne(id);
        const book = await this.prisma.book.delete({
            where: { id },
        });
        return this.enhanceBookWithStockStatus(book);
    }
    async checkStockAvailability(bookId, requestedQuantity) {
        const book = await this.prisma.book.findUnique({
            where: { id: bookId },
            select: { stock: true },
        });
        if (!book) {
            return false;
        }
        return book.stock >= requestedQuantity;
    }
    async getOutOfStockBooks() {
        const books = await this.prisma.book.findMany({
            where: { stock: 0 },
            orderBy: { updatedAt: 'desc' },
        });
        return this.enhanceBooksWithStockStatus(books);
    }
    async getLowStockBooks() {
        const books = await this.prisma.book.findMany({
            where: {
                stock: {
                    gt: 0,
                    lte: 5
                }
            },
            orderBy: { stock: 'asc' },
        });
        return this.enhanceBooksWithStockStatus(books);
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BooksService);
//# sourceMappingURL=books.service.js.map