import { PrismaService } from '../database/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBooksDto } from './dto/search-books.dto';
import { BookWithStockStatus } from './types/book-with-stock-status.type';
export declare class BooksService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private calculateStockStatus;
    private enhanceBookWithStockStatus;
    private enhanceBooksWithStockStatus;
    findAll(searchDto?: SearchBooksDto): Promise<{
        books: BookWithStockStatus[];
        total: number;
        page: number;
        limit: number;
        message?: string;
    }>;
    findOne(id: string): Promise<BookWithStockStatus>;
    create(dto: CreateBookDto): Promise<BookWithStockStatus>;
    update(id: string, dto: UpdateBookDto): Promise<BookWithStockStatus>;
    remove(id: string): Promise<BookWithStockStatus>;
    checkStockAvailability(bookId: string, requestedQuantity: number): Promise<boolean>;
    getOutOfStockBooks(): Promise<BookWithStockStatus[]>;
    getLowStockBooks(): Promise<BookWithStockStatus[]>;
}
