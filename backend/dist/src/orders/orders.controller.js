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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const jwt_guard_1 = require("../auth/jwt.guard");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(req) {
        return this.ordersService.create(req.user.sub);
    }
    findAll(req) {
        return this.ordersService.findAll(req.user.sub);
    }
    findOne(req, id) {
        return this.ordersService.findOne(req.user.sub, id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create order from cart (checkout)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Order created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                totalPrice: { type: 'number' },
                status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
                orderItems: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            orderId: { type: 'string' },
                            bookId: { type: 'string' },
                            quantity: { type: 'number' },
                            price: { type: 'number' },
                        },
                    },
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - empty cart or insufficient stock' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user order history' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Orders retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    totalPrice: { type: 'number' },
                    status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
                    orderItems: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                orderId: { type: 'string' },
                                bookId: { type: 'string' },
                                quantity: { type: 'number' },
                                price: { type: 'number' },
                                book: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        title: { type: 'string' },
                                        author: { type: 'string' },
                                        isbn: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific order by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Order found',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                totalPrice: { type: 'number' },
                status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
                orderItems: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            orderId: { type: 'string' },
                            bookId: { type: 'string' },
                            quantity: { type: 'number' },
                            price: { type: 'number' },
                            book: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    title: { type: 'string' },
                                    author: { type: 'string' },
                                    isbn: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - JWT token required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Order not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('orders'),
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map