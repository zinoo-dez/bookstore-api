import type { Book } from '@/lib/schemas'

const BEST_SELLER_KEYWORDS = ['best seller', 'bestseller', 'best-seller']

const includesBestSellerTag = (values?: string[] | null) => {
  if (!values || values.length === 0) return false
  return values.some((value) => {
    const normalized = value.trim().toLowerCase()
    return BEST_SELLER_KEYWORDS.some((keyword) => normalized.includes(keyword))
  })
}

export const isBestSellerBook = (
  book: Pick<Book, 'rating' | 'stock' | 'categories' | 'genres'>,
): boolean => {
  if (includesBestSellerTag(book.categories) || includesBestSellerTag(book.genres)) {
    return true
  }

  const rating = book.rating ?? 0
  return book.stock > 0 && rating >= 4.8
}
