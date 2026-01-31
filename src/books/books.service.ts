import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBooksDto } from './dto/search-books.dto';
import { Book } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(searchDto?: SearchBooksDto): Promise<{ books: Book[]; total: number; page: number; limit: number; message?: string; }> {
    const { title, author, isbn, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = searchDto || {};

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
  books,
  total,
  page,
  limit,
};
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async create(dto: CreateBookDto): Promise<Book> {
    return await this.prisma.book.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id); 
    
    return await this.prisma.book.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Book> {
    const book = await this.findOne(id);
    
    return await this.prisma.book.delete({
      where: { id },
    });
  }
}
