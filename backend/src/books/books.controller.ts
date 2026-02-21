import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBooksDto } from './dto/search-books.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all books with optional search and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    description: 'Filter by title',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    description: 'Filter by author',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'genre',
    required: false,
    type: String,
    description: 'Filter by genre',
  })
  @ApiQuery({
    name: 'isbn',
    required: false,
    type: String,
    description: 'Filter by ISBN',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field (title, author, price, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: 200,
    description: 'Books retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        books: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              author: { type: 'string' },
              isbn: { type: 'string' },
              price: { type: 'number' },
              stock: { type: 'number' },
              description: { type: 'string', nullable: true },
              inStock: { type: 'boolean' },
              stockStatus: {
                type: 'string',
                enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'],
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  findAll(@Query() searchDto: SearchBooksDto) {
    return this.booksService.findAll(searchDto);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular books based on purchases' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of popular books to return (default: 6)',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular books retrieved successfully',
  })
  getPopularBooks(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.booksService.getPopularBooks(parsedLimit);
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get recommended books based on recent user purchases',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recommended books to return (default: 6)',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommended books retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  getRecommendedBooks(@Request() req: any, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.booksService.getRecommendedBooks(req.user.sub, parsedLimit);
  }

  @Get('inventory/out-of-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all out of stock books (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Out of stock books retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          isbn: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'number' },
          description: { type: 'string', nullable: true },
          inStock: { type: 'boolean' },
          stockStatus: { type: 'string', enum: ['OUT_OF_STOCK'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getOutOfStockBooks() {
    return this.booksService.getOutOfStockBooks();
  }

  @Get('inventory/low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all low stock books (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Low stock books retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          isbn: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'number' },
          description: { type: 'string', nullable: true },
          inStock: { type: 'boolean' },
          stockStatus: { type: 'string', enum: ['LOW_STOCK'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getLowStockBooks() {
    return this.booksService.getLowStockBooks();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiResponse({
    status: 200,
    description: 'Book found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        author: { type: 'string' },
        isbn: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        description: { type: 'string', nullable: true },
        inStock: { type: 'boolean' },
        stockStatus: {
          type: 'string',
          enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Get(':id/stock-availability')
  @ApiOperation({ summary: 'Check stock availability for a specific quantity' })
  @ApiQuery({
    name: 'quantity',
    required: true,
    type: Number,
    description: 'Requested quantity',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock availability checked',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        requestedQuantity: { type: 'number' },
        availableStock: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  async checkStockAvailability(
    @Param('id') id: string,
    @Query('quantity') quantity: string,
  ) {
    const requestedQuantity = parseInt(quantity, 10);

    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
      throw new BadRequestException('Invalid quantity');
    }

    const book = await this.booksService.findOne(id);
    const available = await this.booksService.checkStockAvailability(
      id,
      requestedQuantity,
    );

    return {
      available,
      requestedQuantity,
      availableStock: book.stock,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new book (Admin only)' })
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({
    status: 201,
    description: 'Book successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        author: { type: 'string' },
        isbn: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        description: { type: 'string', nullable: true },
        inStock: { type: 'boolean' },
        stockStatus: {
          type: 'string',
          enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a book (Admin only)' })
  @ApiBody({ type: UpdateBookDto })
  @ApiResponse({
    status: 200,
    description: 'Book successfully updated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        author: { type: 'string' },
        isbn: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        description: { type: 'string', nullable: true },
        inStock: { type: 'boolean' },
        stockStatus: {
          type: 'string',
          enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a book (Admin only)' })
  @ApiResponse({ status: 200, description: 'Book successfully deleted' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
