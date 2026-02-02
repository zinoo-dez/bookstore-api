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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const books_service_1 = require("./books.service");
const create_book_dto_1 = require("./dto/create-book.dto");
const update_book_dto_1 = require("./dto/update-book.dto");
const search_books_dto_1 = require("./dto/search-books.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let BooksController = class BooksController {
    booksService;
    constructor(booksService) {
        this.booksService = booksService;
    }
    findAll(searchDto) {
        return this.booksService.findAll(searchDto);
    }
    getOutOfStockBooks() {
        return this.booksService.getOutOfStockBooks();
    }
    getLowStockBooks() {
        return this.booksService.getLowStockBooks();
    }
    findOne(id) {
        return this.booksService.findOne(id);
    }
    async checkStockAvailability(id, quantity) {
        const requestedQuantity = parseInt(quantity, 10);
        if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
            throw new common_1.BadRequestException('Invalid quantity');
        }
        const book = await this.booksService.findOne(id);
        const available = await this.booksService.checkStockAvailability(id, requestedQuantity);
        return {
            available,
            requestedQuantity,
            availableStock: book.stock,
        };
    }
    create(dto) {
        return this.booksService.create(dto);
    }
    update(id, dto) {
        return this.booksService.update(id, dto);
    }
    remove(id) {
        return this.booksService.remove(id);
    }
};
exports.BooksController = BooksController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all books with optional search and pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' }),
    (0, swagger_1.ApiQuery)({ name: 'title', required: false, type: String, description: 'Filter by title' }),
    (0, swagger_1.ApiQuery)({ name: 'author', required: false, type: String, description: 'Filter by author' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, type: String, description: 'Filter by category' }),
    (0, swagger_1.ApiQuery)({ name: 'isbn', required: false, type: String, description: 'Filter by ISBN' }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, type: String, description: 'Sort by field (title, author, price, createdAt)' }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Books retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                books: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            author: { type: 'string' },
                            isbn: { type: 'string' },
                            price: { type: 'number' },
                            stock: { type: 'number' },
                            description: { type: 'string', nullable: true },
                            inStock: { type: 'boolean' },
                            stockStatus: { type: 'string', enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'] },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' },
            },
        },
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_books_dto_1.SearchBooksDto]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('inventory/out-of-stock'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all out of stock books (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Out of stock books retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    author: { type: 'string' },
                    isbn: { type: 'string' },
                    price: { type: 'number' },
                    stock: { type: 'number' },
                    description: { type: 'string', nullable: true },
                    inStock: { type: 'boolean' },
                    stockStatus: { type: 'string', enum: ['OUT_OF_STOCK'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin role required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "getOutOfStockBooks", null);
__decorate([
    (0, common_1.Get)('inventory/low-stock'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all low stock books (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Low stock books retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    author: { type: 'string' },
                    isbn: { type: 'string' },
                    price: { type: 'number' },
                    stock: { type: 'number' },
                    description: { type: 'string', nullable: true },
                    inStock: { type: 'boolean' },
                    stockStatus: { type: 'string', enum: ['LOW_STOCK'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin role required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "getLowStockBooks", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a book by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Book found',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                author: { type: 'string' },
                isbn: { type: 'string' },
                price: { type: 'number' },
                stock: { type: 'number' },
                description: { type: 'string', nullable: true },
                inStock: { type: 'boolean' },
                stockStatus: { type: 'string', enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Book not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stock-availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Check stock availability for a specific quantity' }),
    (0, swagger_1.ApiQuery)({ name: 'quantity', required: true, type: Number, description: 'Requested quantity' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Stock availability checked',
        schema: {
            type: 'object',
            properties: {
                available: { type: 'boolean' },
                requestedQuantity: { type: 'number' },
                availableStock: { type: 'number' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Book not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid quantity' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "checkStockAvailability", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new book (Admin only)' }),
    (0, swagger_1.ApiBody)({ type: create_book_dto_1.CreateBookDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Book successfully created',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                author: { type: 'string' },
                isbn: { type: 'string' },
                price: { type: 'number' },
                stock: { type: 'number' },
                description: { type: 'string', nullable: true },
                inStock: { type: 'boolean' },
                stockStatus: { type: 'string', enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin role required' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation failed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_book_dto_1.CreateBookDto]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a book (Admin only)' }),
    (0, swagger_1.ApiBody)({ type: update_book_dto_1.UpdateBookDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Book successfully updated',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                author: { type: 'string' },
                isbn: { type: 'string' },
                price: { type: 'number' },
                stock: { type: 'number' },
                description: { type: 'string', nullable: true },
                inStock: { type: 'boolean' },
                stockStatus: { type: 'string', enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin role required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Book not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation failed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_book_dto_1.UpdateBookDto]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a book (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Book successfully deleted' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin role required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Book not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "remove", null);
exports.BooksController = BooksController = __decorate([
    (0, swagger_1.ApiTags)('books'),
    (0, common_1.Controller)('books'),
    __metadata("design:paramtypes", [books_service_1.BooksService])
], BooksController);
//# sourceMappingURL=books.controller.js.map