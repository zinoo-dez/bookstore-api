import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
