import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  WarehouseAlertStatus,
} from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { SetWarehouseStockDto } from './dto/set-warehouse-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ReviewPurchaseRequestDto } from './dto/review-purchase-request.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { CreatePurchaseOrdersBatchDto } from './dto/create-purchase-orders-batch.dto';

@ApiTags('warehouses')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List warehouses' })
  @ApiResponse({
    status: 200,
    description: 'Warehouses retrieved successfully',
  })
  listWarehouses() {
    return this.warehousesService.listWarehouses();
  }

  @Get('book-stock-presence')
  @Permissions('warehouse.view')
  @ApiOperation({
    summary:
      'Get per-book warehouse stock presence count (how many active warehouses have a stock row)',
  })
  getBookStockPresence() {
    return this.warehousesService.getBookStockPresence();
  }

  @Post()
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Create warehouse' })
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.createWarehouse(dto);
  }

  @Patch(':id')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Update warehouse' })
  updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.updateWarehouse(id, dto);
  }

  @Delete(':id')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Delete warehouse (must be empty)' })
  deleteWarehouse(@Param('id') id: string) {
    return this.warehousesService.deleteWarehouse(id);
  }

  @Get('alerts/low-stock')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List low-stock alerts' })
  @ApiQuery({ name: 'status', required: false, enum: WarehouseAlertStatus })
  listLowStockAlerts(@Query('status') status?: WarehouseAlertStatus) {
    return this.warehousesService.listLowStockAlerts(status);
  }

  @Get('transfers')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List stock transfers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listTransfers(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 50;
    return this.warehousesService.listTransfers(parsed);
  }

  @Get('purchase-requests')
  @Permissions('warehouse.purchase_request.view')
  @ApiOperation({ summary: 'List purchase requests' })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseRequestStatus })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  listPurchaseRequests(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: PurchaseRequestStatus,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.warehousesService.listPurchaseRequests(req.user.sub, {
      status,
      warehouseId,
    });
  }

  @Get('vendors')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List vendors' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  listVendors(@Query('activeOnly') activeOnly?: string) {
    const parsed = activeOnly === undefined ? undefined : activeOnly === 'true';
    return this.warehousesService.listVendors(parsed);
  }

  @Post('vendors')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Create vendor' })
  createVendor(@Body() dto: CreateVendorDto) {
    return this.warehousesService.createVendor(dto);
  }

  @Patch('vendors/:id')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Update vendor' })
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.warehousesService.updateVendor(id, dto);
  }

  @Delete('vendors/:id')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Delete vendor' })
  deleteVendor(@Param('id') id: string) {
    return this.warehousesService.deleteVendor(id);
  }

  @Get('purchase-orders')
  @Permissions('warehouse.purchase_order.view')
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  listPurchaseOrders(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: PurchaseOrderStatus,
    @Query('warehouseId') warehouseId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.warehousesService.listPurchaseOrders(req.user.sub, {
      status,
      warehouseId,
      vendorId,
    });
  }

  @Post('purchase-orders')
  @Permissions('warehouse.purchase_order.create')
  @ApiOperation({
    summary: 'Create purchase order from approved purchase request',
  })
  createPurchaseOrder(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.warehousesService.createPurchaseOrder(dto, req.user.sub);
  }

  @Post('purchase-orders/batch')
  @Permissions('warehouse.purchase_order.create')
  @ApiOperation({
    summary: 'Batch create purchase orders from approved purchase requests',
  })
  createPurchaseOrdersBatch(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePurchaseOrdersBatchDto,
  ) {
    return this.warehousesService.createPurchaseOrdersBatch(dto, req.user.sub);
  }

  @Patch('purchase-orders/:id/receive')
  @Permissions('warehouse.purchase_order.receive')
  @ApiOperation({
    summary: 'Receive stock for purchase order and update inventory',
  })
  receivePurchaseOrder(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.warehousesService.receivePurchaseOrder(id, dto, req.user.sub);
  }

  @Post('purchase-requests')
  @Permissions('warehouse.purchase_request.create')
  @ApiOperation({ summary: 'Create purchase request' })
  createPurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.warehousesService.createPurchaseRequest(dto, req.user.sub);
  }

  @Patch('purchase-requests/:id/submit')
  @Permissions('warehouse.purchase_request.create')
  @ApiOperation({ summary: 'Submit draft purchase request for approval' })
  submitPurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.warehousesService.submitPurchaseRequest(id, req.user.sub);
  }

  @Patch('purchase-requests/:id/review')
  @Permissions('finance.purchase_request.review')
  @ApiOperation({ summary: 'Finance review purchase request (approve/reject)' })
  reviewPurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ReviewPurchaseRequestDto,
  ) {
    return this.warehousesService.reviewPurchaseRequest(id, dto, req.user.sub);
  }

  @Patch('purchase-requests/:id/complete')
  @Permissions('warehouse.purchase_request.complete')
  @ApiOperation({ summary: 'Mark approved purchase request as completed' })
  completePurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.warehousesService.completePurchaseRequest(id, req.user.sub);
  }

  @Get(':id/stocks')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List stock rows for a warehouse' })
  getWarehouseStocks(@Param('id') id: string) {
    return this.warehousesService.getWarehouseStocks(id);
  }

  @Put(':id/stocks/:bookId')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Set stock for a book in a warehouse' })
  setWarehouseStock(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Body() dto: SetWarehouseStockDto,
  ) {
    return this.warehousesService.setWarehouseStock(
      id,
      bookId,
      dto,
      req.user.sub,
    );
  }

  @Post('transfer')
  @Permissions('warehouse.transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  transferStock(
    @Request() req: { user: { sub: string } },
    @Body() dto: TransferStockDto,
  ) {
    return this.warehousesService.transferStock(dto, req.user.sub);
  }
}
