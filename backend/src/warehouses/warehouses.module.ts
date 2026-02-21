import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  controllers: [WarehousesController],
  providers: [WarehousesService, PrismaService],
})
export class WarehousesModule {}
