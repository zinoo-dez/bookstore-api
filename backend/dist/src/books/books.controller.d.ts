import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBooksDto } from './dto/search-books.dto';
export declare class BooksController {
    private readonly booksService;
    constructor(booksService: BooksService);
    findAll(searchDto: SearchBooksDto): Promise<{
        books: import("./types/book-with-stock-status.type").BookWithStockStatus[];
        total: number;
        page: number;
        limit: number;
        message?: string;
    }>;
    getOutOfStockBooks(): Promise<import("./types/book-with-stock-status.type").BookWithStockStatus[]>;
    getLowStockBooks(): Promise<import("./types/book-with-stock-status.type").BookWithStockStatus[]>;
    findOne(id: string): Promise<import("./types/book-with-stock-status.type").BookWithStockStatus>;
    checkStockAvailability(id: string, quantity: string): Promise<{
        available: boolean;
        requestedQuantity: number;
        availableStock: number;
    }>;
    create(dto: CreateBookDto): Promise<import("./types/book-with-stock-status.type").BookWithStockStatus>;
    update(id: string, dto: UpdateBookDto): Promise<import("./types/book-with-stock-status.type").BookWithStockStatus>;
    remove(id: string): Promise<import("./types/book-with-stock-status.type").BookWithStockStatus>;
}
