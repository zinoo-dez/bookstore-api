import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [DatabaseModule, AuthModule, CartModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}