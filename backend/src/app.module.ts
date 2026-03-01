import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { LibraryModule } from './library/library.module';
import { ContactModule } from './contact/contact.module';
import { ReadingModule } from './reading/reading.module';
import { BlogsModule } from './blogs/blogs.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { StaffModule } from './staff/staff.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { PromotionsModule } from './promotions/promotions.module';
import { StoresModule } from './stores/stores.module';

import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      exclude: ['/api/(.*)'],
    }),
    ConfigModule,
    DatabaseModule,
    AuthModule,
    BooksModule,
    UsersModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    LibraryModule,
    ContactModule,
    ReadingModule,
    BlogsModule,
    WarehousesModule,
    StaffModule,
    NotificationsModule,
    InquiriesModule,
    PromotionsModule,
    StoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
