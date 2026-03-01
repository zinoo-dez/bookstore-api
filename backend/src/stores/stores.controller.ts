import {
  BadRequestException,
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
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SetStoreStockDto } from './dto/set-store-stock.dto';
import { TransferToStoreDto } from './dto/transfer-to-store.dto';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('public')
  @ApiOperation({ summary: 'List active physical stores for pickup' })
  listPublicStores() {
    return this.storesService.listPublicStores();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List stores for admin/operations' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'trashed', 'all'],
  })
  listStores(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: 'active' | 'trashed' | 'all',
  ) {
    return this.storesService.listStores(req.user.sub, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Create store' })
  createStore(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateStoreDto,
  ) {
    return this.storesService.createStore(dto, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Update store' })
  updateStore(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Delete store (requires no active stock/orders)' })
  deleteStore(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.storesService.deleteStore(id, req.user.sub);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Restore soft-deleted store from bin' })
  restoreStore(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.storesService.restoreStore(id, req.user.sub);
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Permanently delete store from bin' })
  permanentDeleteStore(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.storesService.permanentDeleteStore(id, req.user.sub);
  }

  @Get(':id/stocks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'Get store stock rows' })
  getStoreStocks(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.storesService.getStoreStocks(id, req.user.sub);
  }

  @Put(':id/stocks/:bookId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Set stock for store + book' })
  setStoreStock(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Body() dto: SetStoreStockDto,
  ) {
    return this.storesService.setStoreStock(id, bookId, dto, req.user.sub);
  }

  @Post('transfer-from-warehouse')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.transfer')
  @ApiOperation({ summary: 'Transfer stock from warehouse to physical store' })
  transferFromWarehouse(
    @Request() req: { user: { sub: string } },
    @Body() dto: TransferToStoreDto,
  ) {
    return this.storesService.transferFromWarehouse(dto, req.user.sub);
  }

  @Get('transfers/history')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List warehouse to store transfer history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listTransfers(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? parseInt(limit, 10) : 50;
    return this.storesService.listTransfers(req.user.sub, parsed);
  }

  @Get('sales/overview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Store pickup sales overview for admin reporting' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getSalesOverview(
    @Request() req: { user: { sub: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    if (fromDate && Number.isNaN(fromDate.getTime())) {
      throw new BadRequestException('Invalid `from` date');
    }
    if (toDate && Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid `to` date');
    }
    return this.storesService.getSalesOverview(req.user.sub, fromDate, toDate);
  }
}
