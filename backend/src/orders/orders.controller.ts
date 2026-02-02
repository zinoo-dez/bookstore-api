import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart (checkout)' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 400, description: 'Bad request - empty cart or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  create(@Request() req: any) {
    return this.ordersService.create(req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get user order history' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific order by ID' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.sub, id);
  }
}