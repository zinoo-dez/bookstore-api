import { z } from 'zod';
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export const bookSchema = z.object({
    id: z.string(),
    title: z.string(),
    author: z.string(),
    isbn: z.string(),
    price: z.number(),
    stock: z.number(),
    description: z.string().nullable(),
    inStock: z.boolean(),
    stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const createBookSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    author: z.string().min(1, 'Author is required').max(100),
    isbn: z.string().min(10, 'ISBN must be at least 10 characters').max(17),
    price: z.number().min(0.01, 'Price must be greater than 0'),
    stock: z.number().min(0, 'Stock cannot be negative').optional(),
    description: z.string().max(500).optional(),
});
export const searchBooksSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(50).optional(),
    title: z.string().optional(),
    author: z.string().optional(),
    category: z.string().optional(),
    isbn: z.string().optional(),
    sortBy: z.enum(['title', 'author', 'price', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});
export const addToCartSchema = z.object({
    bookId: z.string(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
});
export const createOrderSchema = z.object({
    items: z.array(z.object({
        bookId: z.string(),
        quantity: z.number().min(1),
    })).min(1, 'Order must contain at least one item'),
});
export const booksResponseSchema = z.object({
    books: z.array(bookSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
});
export const authResponseSchema = z.object({
    access_token: z.string(),
});
export const userSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(['USER', 'ADMIN']),
    createdAt: z.string(),
});
//# sourceMappingURL=schemas.js.map