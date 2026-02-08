import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBooksDto } from './dto/search-books.dto';
import { Book } from '@prisma/client';
import {
  BookWithStockStatus,
  BookStockStatus,
} from './types/book-with-stock-status.type';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Calculate stock status for a book
   */
  private calculateStockStatus(stock: number): BookStockStatus {
    if (stock === 0) {
      return 'OUT_OF_STOCK';
    } else if (stock <= 5) {
      return 'LOW_STOCK';
    } else {
      return 'IN_STOCK';
    }
  }

  /**
   * Enhance a book with stock status information
   */
  private enhanceBookWithStockStatus(book: Book): BookWithStockStatus {
    const stockStatus = this.calculateStockStatus(book.stock);
    return {
      ...book,
      inStock: book.stock > 0,
      stockStatus,
    };
  }

  /**
   * Enhance multiple books with stock status information
   */
  private enhanceBooksWithStockStatus(books: Book[]): BookWithStockStatus[] {
    return books.map((book) => this.enhanceBookWithStockStatus(book));
  }

  async findAll(searchDto?: SearchBooksDto): Promise<{
    books: BookWithStockStatus[];
    total: number;
    page: number;
    limit: number;
    message?: string;
  }> {
    const {
      title,
      author,
      isbn,
      category,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto || {};

    const where: any = {};

    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }

    if (author) {
      where.author = { contains: author, mode: 'insensitive' };
    }

    if (isbn) {
      where.isbn = { contains: isbn, mode: 'insensitive' };
    }

    if (category) {
      where.categories = { hasSome: [category] };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Rating filter
    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    // Stock availability filter
    if (inStock === true) {
      where.stock = { gt: 0 };
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.book.count({ where }),
    ]);

    if (total === 0) {
      return {
        message: 'No books found matching your search',
        books: [],
        total,
        page,
        limit,
      };
    }

    return {
      books: this.enhanceBooksWithStockStatus(books),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<BookWithStockStatus> {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return this.enhanceBookWithStockStatus(book);
  }

  async create(dto: CreateBookDto): Promise<BookWithStockStatus> {
    const book = await this.prisma.book.create({
      data: dto,
    });

    return this.enhanceBookWithStockStatus(book);
  }

  async update(id: string, dto: UpdateBookDto): Promise<BookWithStockStatus> {
    const existingBook = await this.findOne(id);

    const book = await this.prisma.book.update({
      where: { id },
      data: dto,
    });

    return this.enhanceBookWithStockStatus(book);
  }

  async remove(id: string): Promise<BookWithStockStatus> {
    const existingBook = await this.findOne(id);

    const book = await this.prisma.book.delete({
      where: { id },
    });

    return this.enhanceBookWithStockStatus(book);
  }

  /**
   * Check if a book is available for purchase with the requested quantity
   */
  async checkStockAvailability(
    bookId: string,
    requestedQuantity: number,
  ): Promise<boolean> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { stock: true },
    });

    if (!book) {
      return false;
    }

    return book.stock >= requestedQuantity;
  }

  /**
   * Get books that are out of stock
   */
  async getOutOfStockBooks(): Promise<BookWithStockStatus[]> {
    const books = await this.prisma.book.findMany({
      where: { stock: 0 },
      orderBy: { updatedAt: 'desc' },
    });

    return this.enhanceBooksWithStockStatus(books);
  }

  /**
   * Get books with low stock (stock <= 5)
   */
  async getLowStockBooks(): Promise<BookWithStockStatus[]> {
    const books = await this.prisma.book.findMany({
      where: {
        stock: {
          gt: 0,
          lte: 5,
        },
      },
      orderBy: { stock: 'asc' },
    });

    return this.enhanceBooksWithStockStatus(books);
  }

  /**
   * Get popular books based on total quantity purchased
   */
  async getPopularBooks(limit = 6): Promise<BookWithStockStatus[]> {
    const topPurchased = await this.prisma.orderItem.groupBy({
      by: ['bookId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    if (topPurchased.length === 0) {
      return [];
    }

    const orderedIds = topPurchased.map((item) => item.bookId);
    const books = await this.prisma.book.findMany({
      where: { id: { in: orderedIds } },
    });

    const bookMap = new Map(books.map((book) => [book.id, book]));
    const orderedBooks = orderedIds
      .map((id) => bookMap.get(id))
      .filter((book): book is Book => !!book);

    return this.enhanceBooksWithStockStatus(orderedBooks);
  }

  /**
   * Get recommended books based on the user's most recent purchase category
   */
  async getRecommendedBooks(
    userId: string,
    limit = 6,
  ): Promise<BookWithStockStatus[]> {
    const latestOrder = await this.prisma.order.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          orderBy: { createdAt: 'desc' },
          include: { book: true },
        },
      },
    });

    if (!latestOrder || latestOrder.orderItems.length === 0) {
      return [];
    }

    const lastBook = latestOrder.orderItems[0]?.book;
    const category = lastBook?.categories?.[0];

    if (!category) {
      return [];
    }

    const excludeIds = latestOrder.orderItems.map((item) => item.bookId);

    const books = await this.prisma.book.findMany({
      where: {
        categories: { hasSome: [category] },
        id: { notIn: excludeIds },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return this.enhanceBooksWithStockStatus(books);
  }
}
