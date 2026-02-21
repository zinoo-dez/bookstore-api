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
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('reviews')
@Controller('books/:bookId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a review for a book' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Already reviewed this book' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  create(
    @Request() req: any,
    @Param('bookId') bookId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.sub, bookId, createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews for a book' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  findByBook(@Param('bookId') bookId: string) {
    return this.reviewsService.findByBook(bookId);
  }
}

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReviewsManagementController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update own review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Can only update own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, req.user.sub, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Can only delete own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.reviewsService.delete(id, req.user.sub);
    return { message: 'Review deleted successfully' };
  }
}
