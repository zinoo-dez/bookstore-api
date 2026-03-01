import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBooksDto } from './dto/search-books.dto';
import { Book } from '@prisma/client';
import {
  BookWithStockStatus,
  BookStockStatus,
} from './types/book-with-stock-status.type';
import { BOOK_GENRES_BY_CATEGORY } from './constants/book-taxonomy';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeTagList(values?: string[] | null) {
    if (!Array.isArray(values)) {
      return undefined;
    }
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  }

  private validateAndNormalizeTaxonomy(
    dto: CreateBookDto | UpdateBookDto,
    existing?: { categories?: string[] | null; genres?: string[] | null },
  ) {
    const normalizedCategories = this.normalizeTagList(dto.categories);
    const normalizedGenres = this.normalizeTagList(dto.genres);

    const categoriesForValidation = normalizedCategories ?? existing?.categories ?? [];
    const genresForValidation = normalizedGenres ?? existing?.genres ?? [];

    if (genresForValidation.length > 0) {
      if (!categoriesForValidation.length) {
        throw new BadRequestException(
          'Select at least one category before assigning genres.',
        );
      }

      const allowedGenres = new Set(
        categoriesForValidation.flatMap(
          (category) =>
            BOOK_GENRES_BY_CATEGORY[
              category as keyof typeof BOOK_GENRES_BY_CATEGORY
            ] ?? [],
        ),
      );
      const mismatchedGenres = genresForValidation.filter(
        (genre) => !allowedGenres.has(genre),
      );

      if (mismatchedGenres.length > 0) {
        throw new BadRequestException(
          `These genres do not match the selected categories: ${mismatchedGenres.join(', ')}.`,
        );
      }
    }

    return {
      categories: normalizedCategories,
      genres: normalizedGenres,
    };
  }

  private validateDigitalBookPayload(
    dto: CreateBookDto | UpdateBookDto,
    options?: { allowExistingDigital?: boolean },
  ) {
    const isDigital = dto.isDigital === true;
    const hasDigitalFormat = typeof dto.ebookFormat !== 'undefined';
    const hasDigitalFile = typeof dto.ebookFilePath !== 'undefined';
    const allowExistingDigital = options?.allowExistingDigital === true;

    if (!isDigital && !allowExistingDigital && (hasDigitalFormat || hasDigitalFile)) {
      throw new BadRequestException(
        'ebookFormat and ebookFilePath are only allowed when isDigital is true.',
      );
    }

    if (isDigital) {
      if (
        typeof dto.ebookPrice !== 'undefined'
        && Number(dto.ebookPrice) <= 0
      ) {
        throw new BadRequestException('ebookPrice must be greater than 0.');
      }
      if (!dto.ebookFormat) {
        throw new BadRequestException('ebookFormat is required for digital books.');
      }
      if (!dto.ebookFilePath?.trim()) {
        throw new BadRequestException('ebookFilePath is required for digital books.');
      }
    }
  }

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
      genre,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      status = 'active',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto || {};

    const where: any = {};
    if (status === 'active') {
      where.deletedAt = null;
    } else if (status === 'trashed') {
      where.deletedAt = { not: null };
    }

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

    if (genre) {
      where.genres = { hasSome: [genre] };
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

  async findOne(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<BookWithStockStatus> {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book || (!options?.includeDeleted && book.deletedAt)) {
      throw new NotFoundException('Book not found');
    }

    return this.enhanceBookWithStockStatus(book);
  }

  async create(dto: CreateBookDto): Promise<BookWithStockStatus> {
    this.validateDigitalBookPayload(dto);
    const taxonomy = this.validateAndNormalizeTaxonomy(dto);
    const book = await this.prisma.book.create({
      data: {
        ...dto,
        ...(taxonomy.categories ? { categories: taxonomy.categories } : {}),
        ...(taxonomy.genres ? { genres: taxonomy.genres } : {}),
      },
    });

    return this.enhanceBookWithStockStatus(book);
  }

  async update(id: string, dto: UpdateBookDto): Promise<BookWithStockStatus> {
    const existingBook = await this.findOne(id);
    this.validateDigitalBookPayload(dto, {
      allowExistingDigital: existingBook.isDigital,
    });
    const taxonomy = this.validateAndNormalizeTaxonomy(dto, {
      categories: existingBook.categories,
      genres: existingBook.genres ?? [],
    });

    const updateData: any = { ...dto };
    if (taxonomy.categories) {
      updateData.categories = taxonomy.categories;
    }
    if (taxonomy.genres) {
      updateData.genres = taxonomy.genres;
    }
    if (dto.isDigital === false) {
      updateData.ebookFormat = null;
      updateData.ebookFilePath = null;
      updateData.totalPages = null;
    }

    const book = await this.prisma.book.update({
      where: { id },
      data: updateData,
    });

    return this.enhanceBookWithStockStatus(book);
  }

  async remove(id: string): Promise<BookWithStockStatus> {
    const existingBook = await this.findOne(id, { includeDeleted: true });

    if (existingBook.deletedAt) {
      return this.enhanceBookWithStockStatus(existingBook);
    }

    const book = await this.prisma.book.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.enhanceBookWithStockStatus(book);
  }

  async restore(id: string): Promise<BookWithStockStatus> {
    const existingBook = await this.findOne(id, { includeDeleted: true });

    if (!existingBook.deletedAt) {
      return this.enhanceBookWithStockStatus(existingBook);
    }

    const book = await this.prisma.book.update({
      where: { id },
      data: { deletedAt: null },
    });

    return this.enhanceBookWithStockStatus(book);
  }

  async permanentlyDelete(id: string): Promise<BookWithStockStatus> {
    const existingBook = await this.findOne(id, { includeDeleted: true });
    if (!existingBook.deletedAt) {
      throw new BadRequestException('Book must be in the bin before permanent deletion.');
    }

    const [purchaseRequestRefs, purchaseOrderItemRefs] = await Promise.all([
      this.prisma.purchaseRequest.count({ where: { bookId: id } }),
      this.prisma.purchaseOrderItem.count({ where: { bookId: id } }),
    ]);

    if (purchaseRequestRefs > 0 || purchaseOrderItemRefs > 0) {
      const parts: string[] = [];
      if (purchaseRequestRefs > 0) {
        parts.push(
          `${purchaseRequestRefs} purchase request${purchaseRequestRefs > 1 ? 's' : ''}`,
        );
      }
      if (purchaseOrderItemRefs > 0) {
        parts.push(
          `${purchaseOrderItemRefs} purchase order item${purchaseOrderItemRefs > 1 ? 's' : ''}`,
        );
      }
      throw new BadRequestException(
        `Cannot delete this book because it is linked to ${parts.join(' and ')}.`,
      );
    }

    try {
      const book = await this.prisma.book.delete({
        where: { id },
      });

      return this.enhanceBookWithStockStatus(book);
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete this book because it is referenced by existing records.',
        );
      }
      throw error;
    }
  }

  async emptyBin(): Promise<{ deleted: number }> {
    const candidates = await this.prisma.book.findMany({
      where: {
        deletedAt: { not: null },
        purchaseRequests: { none: {} },
        purchaseOrderItems: { none: {} },
      },
      select: { id: true },
    });

    if (candidates.length === 0) {
      return { deleted: 0 };
    }

    const result = await this.prisma.book.deleteMany({
      where: { id: { in: candidates.map((book) => book.id) } },
    });

    return { deleted: result.count };
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
      select: { stock: true, deletedAt: true },
    });

    if (!book || book.deletedAt) {
      return false;
    }

    return book.stock >= requestedQuantity;
  }

  /**
   * Get books that are out of stock
   */
  async getOutOfStockBooks(): Promise<BookWithStockStatus[]> {
    const books = await this.prisma.book.findMany({
      where: { stock: 0, deletedAt: null },
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
        deletedAt: null,
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
      where: { id: { in: orderedIds }, deletedAt: null },
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
        deletedAt: null,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return this.enhanceBooksWithStockStatus(books);
  }
}
