import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
}, {
    email: string;
    name: string;
    password: string;
}>;
export declare const bookSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    author: z.ZodString;
    isbn: z.ZodString;
    price: z.ZodNumber;
    stock: z.ZodNumber;
    description: z.ZodNullable<z.ZodString>;
    inStock: z.ZodBoolean;
    stockStatus: z.ZodEnum<["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    id: string;
    author: string;
    isbn: string;
    price: number;
    stock: number;
    description: string | null;
    inStock: boolean;
    stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
    createdAt: string;
    updatedAt: string;
}, {
    title: string;
    id: string;
    author: string;
    isbn: string;
    price: number;
    stock: number;
    description: string | null;
    inStock: boolean;
    stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
    createdAt: string;
    updatedAt: string;
}>;
export declare const createBookSchema: z.ZodObject<{
    title: z.ZodString;
    author: z.ZodString;
    isbn: z.ZodString;
    price: z.ZodNumber;
    stock: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    author: string;
    isbn: string;
    price: number;
    stock?: number | undefined;
    description?: string | undefined;
}, {
    title: string;
    author: string;
    isbn: string;
    price: number;
    stock?: number | undefined;
    description?: string | undefined;
}>;
export declare const searchBooksSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    isbn: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodEnum<["title", "author", "price", "createdAt"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    page?: number | undefined;
    author?: string | undefined;
    isbn?: string | undefined;
    limit?: number | undefined;
    category?: string | undefined;
    sortBy?: "title" | "author" | "price" | "createdAt" | undefined;
    sortOrder?: "desc" | "asc" | undefined;
}, {
    title?: string | undefined;
    page?: number | undefined;
    author?: string | undefined;
    isbn?: string | undefined;
    limit?: number | undefined;
    category?: string | undefined;
    sortBy?: "title" | "author" | "price" | "createdAt" | undefined;
    sortOrder?: "desc" | "asc" | undefined;
}>;
export declare const addToCartSchema: z.ZodObject<{
    bookId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    bookId: string;
    quantity: number;
}, {
    bookId: string;
    quantity: number;
}>;
export declare const createOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        bookId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        bookId: string;
        quantity: number;
    }, {
        bookId: string;
        quantity: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        bookId: string;
        quantity: number;
    }[];
}, {
    items: {
        bookId: string;
        quantity: number;
    }[];
}>;
export declare const booksResponseSchema: z.ZodObject<{
    books: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        author: z.ZodString;
        isbn: z.ZodString;
        price: z.ZodNumber;
        stock: z.ZodNumber;
        description: z.ZodNullable<z.ZodString>;
        inStock: z.ZodBoolean;
        stockStatus: z.ZodEnum<["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK"]>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        id: string;
        author: string;
        isbn: string;
        price: number;
        stock: number;
        description: string | null;
        inStock: boolean;
        stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
        createdAt: string;
        updatedAt: string;
    }, {
        title: string;
        id: string;
        author: string;
        isbn: string;
        price: number;
        stock: number;
        description: string | null;
        inStock: boolean;
        stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
        createdAt: string;
        updatedAt: string;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    books: {
        title: string;
        id: string;
        author: string;
        isbn: string;
        price: number;
        stock: number;
        description: string | null;
        inStock: boolean;
        stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
        createdAt: string;
        updatedAt: string;
    }[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}, {
    books: {
        title: string;
        id: string;
        author: string;
        isbn: string;
        price: number;
        stock: number;
        description: string | null;
        inStock: boolean;
        stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
        createdAt: string;
        updatedAt: string;
    }[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}>;
export declare const authResponseSchema: z.ZodObject<{
    access_token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    access_token: string;
}, {
    access_token: string;
}>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["USER", "ADMIN"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "ADMIN" | "USER";
    email: string;
    name: string;
    createdAt: string;
}, {
    id: string;
    role: "ADMIN" | "USER";
    email: string;
    name: string;
    createdAt: string;
}>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Book = z.infer<typeof bookSchema>;
export type CreateBookData = z.infer<typeof createBookSchema>;
export type SearchBooksData = z.infer<typeof searchBooksSchema>;
export type AddToCartData = z.infer<typeof addToCartSchema>;
export type CreateOrderData = z.infer<typeof createOrderSchema>;
export type BooksResponse = z.infer<typeof booksResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type User = z.infer<typeof userSchema>;
