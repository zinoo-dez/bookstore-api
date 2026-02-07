import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  // =========================
  // USER: CREATE ORDER
  // =========================
  @Post()
  @ApiOperation({ summary: 'Create order from cart (checkout)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Cart empty or insufficient stock' })
  create(@Request() req: any) {
    return this.ordersService.create(req.user.sub);
  }

  // =========================
  // USER: GET OWN ORDERS
  // =========================
  @Get()
  @ApiOperation({ summary: 'Get user order history' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user.sub);
  }

  // =========================
  // ADMIN: GET ALL ORDERS
  // =========================
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'All orders retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findAllForAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  // =========================
  // USER: GET ONE ORDER
  // =========================
  @Get(':id')
  @ApiOperation({ summary: 'Get specific order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.sub, id);
  }

  // =========================
  // ADMIN: UPDATE ORDER STATUS
  // =========================
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'PENDING' | 'COMPLETED' | 'CANCELLED',
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  // =========================
  // USER: CANCEL OWN ORDER
  // =========================
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel own pending order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Only pending orders can be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.sub, id);
  }
}
