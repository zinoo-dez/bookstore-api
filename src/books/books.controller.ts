import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  
  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }
}
