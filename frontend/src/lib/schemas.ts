import { z } from 'zod'
import { BOOK_CATEGORIES, BOOK_GENRES } from '@/constants/bookTaxonomy'

const normalizeOpenLibraryCoverUrl = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) return value

  try {
    const url = new URL(value)
    if (!url.hostname.includes('covers.openlibrary.org')) return value

    const match = url.pathname.match(/^\/b\/isbn\/(.+)-([SML])\.jpg$/i)
    if (!match) return value

    const rawIsbn = match[1]
    const size = match[2].toUpperCase()
    const normalizedIsbn = rawIsbn.replace(/[^0-9Xx]/g, '').toUpperCase()
    if (!normalizedIsbn) return value

    url.pathname = `/b/isbn/${normalizedIsbn}-${size}.jpg`
    url.searchParams.delete('default')
    return url.toString()
  } catch {
    return value
  }
}

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Book schemas
export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  isbn: z.string(),
  price: z.coerce.number(),
  ebookPrice: z.coerce.number().nullable().optional(),
  stock: z.number(),
  description: z.string().nullable(),
  coverImage: z.preprocess(normalizeOpenLibraryCoverUrl, z.string().nullable()),
  categories: z.array(z.string()).nullable(),
  genres: z.array(z.string()).optional().nullable(),
  rating: z.number().nullable(),
  isDigital: z.boolean().optional().default(false),
  ebookFormat: z.enum(['EPUB', 'PDF']).nullable().optional(),
  ebookFilePath: z.string().nullable().optional(),
  totalPages: z.number().nullable().optional(),
  inStock: z.boolean(),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  author: z.string().min(1, 'Author is required').max(100),
  isbn: z.string().min(10, 'ISBN must be at least 10 characters').max(17),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z.number().min(0, 'Stock cannot be negative').optional(),
  description: z.string().max(500).optional(),
  coverImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  categories: z.array(z.enum(BOOK_CATEGORIES)).min(1, 'At least one category is required'),
  genres: z.array(z.enum(BOOK_GENRES as [string, ...string[]])).optional(),
  isDigital: z.boolean().optional().default(false),
  ebookFormat: z.enum(['EPUB', 'PDF']).optional(),
  ebookFilePath: z.string().max(300).optional(),
  ebookPrice: z.number().min(0.01).optional(),
  totalPages: z.number().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.isDigital) return
  if (!value.ebookFormat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Format is required for digital books.',
      path: ['ebookFormat'],
    })
  }
  if (!value.ebookFilePath?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File path is required for digital books.',
      path: ['ebookFilePath'],
    })
  }
})

export const searchBooksSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  genre: z.string().optional(),
  isbn: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  inStock: z.boolean().optional(),
  status: z.enum(['active', 'trashed', 'all']).optional(),
  sortBy: z.enum(['title', 'author', 'price', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Cart schemas
export const addToCartSchema = z.object({
  bookId: z.string(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
})

// Order schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    bookId: z.string(),
    quantity: z.number().min(1),
  })).min(1, 'Order must contain at least one item'),
})

// API response schemas
export const booksResponseSchema = z.object({
  books: z.array(bookSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  message: z.string().optional(),
})

export const authResponseSchema = z.object({
  access_token: z.string(),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  isStaff: z.boolean().optional().default(false),
  staffStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE']).nullable().optional(),
  permissions: z.array(z.string()).optional().default([]),
  staffRoles: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    code: z.string().nullable().optional(),
  })).optional().default([]),
  primaryStaffRoleName: z.string().nullable().optional(),
  primaryStaffRoleCode: z.string().nullable().optional(),
  staffTitle: z.string().nullable().optional(),
  staffDepartmentName: z.string().nullable().optional(),
  staffDepartmentCode: z.string().nullable().optional(),
  staffProfileId: z.string().nullable().optional(),
  staffEmployeeCode: z.string().nullable().optional(),
  avatarType: z.enum(['emoji', 'upload']).optional().default('emoji'),
  avatarValue: z.string().nullable().optional(),
  // avatar: z.string().optional(), // Deprecated
  backgroundColor: z.string().nullable().optional(),
  pronouns: z.string().nullable().optional(),
  shortBio: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  showEmail: z.boolean().optional().default(false),
  showFollowers: z.boolean().optional().default(true),
  showFollowing: z.boolean().optional().default(true),
  showFavorites: z.boolean().optional().default(false),
  showLikedPosts: z.boolean().optional().default(false),
  supportEnabled: z.boolean().optional().default(false),
  supportUrl: z.string().nullable().optional(),
  supportQrImage: z.string().nullable().optional(),
  createdAt: z.string(),
})

// Type exports
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type Book = z.infer<typeof bookSchema>
export type CreateBookData = z.infer<typeof createBookSchema>
export type SearchBooksData = z.infer<typeof searchBooksSchema>
export type AddToCartData = z.infer<typeof addToCartSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type BooksResponse = z.infer<typeof booksResponseSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type User = z.infer<typeof userSchema>
