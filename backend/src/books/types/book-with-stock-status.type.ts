import { Book } from '@prisma/client';

export interface BookWithStockStatus extends Book {
  inStock: boolean;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
}

export type BookStockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
