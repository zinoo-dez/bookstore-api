import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(
        userId: string,
        bookId: string,
        createReviewDto: CreateReviewDto,
    ): Promise<Review> {
        // Check if book exists
        const book = await this.prisma.book.findUnique({
            where: { id: bookId },
        });

        if (!book) {
            throw new NotFoundException('Book not found');
        }

        // Check if user already reviewed this book
        const existingReview = await this.prisma.review.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId,
                },
            },
        });

        if (existingReview) {
            throw new BadRequestException('You have already reviewed this book');
        }

        // Create review
        const review = await this.prisma.review.create({
            data: {
                userId,
                bookId,
                ...createReviewDto,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarType: true,
                        avatarValue: true,
                        backgroundColor: true,
                    },
                },
            },
        });

        // Update book's average rating
        await this.updateBookRating(bookId);

        return review;
    }

    async findByBook(bookId: string): Promise<Review[]> {
        return await this.prisma.review.findMany({
            where: { bookId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarType: true,
                        avatarValue: true,
                        backgroundColor: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async update(
        reviewId: string,
        userId: string,
        updateReviewDto: UpdateReviewDto,
    ): Promise<Review> {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.userId !== userId) {
            throw new ForbiddenException('You can only update your own reviews');
        }

        const updatedReview = await this.prisma.review.update({
            where: { id: reviewId },
            data: updateReviewDto,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarType: true,
                        avatarValue: true,
                        backgroundColor: true,
                    },
                },
            },
        });

        // Update book's average rating
        await this.updateBookRating(review.bookId);

        return updatedReview;
    }

    async delete(reviewId: string, userId: string): Promise<void> {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.userId !== userId) {
            throw new ForbiddenException('You can only delete your own reviews');
        }

        const bookId = review.bookId;

        await this.prisma.review.delete({
            where: { id: reviewId },
        });

        // Update book's average rating
        await this.updateBookRating(bookId);
    }

    private async updateBookRating(bookId: string): Promise<void> {
        const reviews = await this.prisma.review.findMany({
            where: { bookId },
            select: { rating: true },
        });

        const averageRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

        await this.prisma.book.update({
            where: { id: bookId },
            data: { rating: averageRating },
        });
    }
}
