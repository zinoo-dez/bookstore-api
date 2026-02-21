import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  ReviewsController,
  ReviewsManagementController,
} from './reviews.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewsController, ReviewsManagementController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
