import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { z } from 'zod'
import { bookSchema } from '@/lib/schemas'

const bookLiteSchema = bookSchema
  .omit({ inStock: true, stockStatus: true })
  .extend({
    inStock: z.boolean().optional(),
    stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']).optional(),
  })

const wishlistItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  createdAt: z.string(),
  book: bookLiteSchema.optional(),
})

const favoriteItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  createdAt: z.string(),
  book: bookLiteSchema.optional(),
})

type WishlistItem = z.infer<typeof wishlistItemSchema>
type FavoriteItem = z.infer<typeof favoriteItemSchema>

export const useWishlist = (enabled = true) => {
  return useQuery({
    queryKey: ['library', 'wishlist'],
    queryFn: async () => {
      const response = await api.get('/library/wishlist')
      return z.array(wishlistItemSchema).parse(response.data)
    },
    enabled,
  })
}

export const useFavorites = (enabled = true) => {
  return useQuery({
    queryKey: ['library', 'favorites'],
    queryFn: async () => {
      const response = await api.get('/library/favorites')
      return z.array(favoriteItemSchema).parse(response.data)
    },
    enabled,
  })
}

export const useAddToWishlist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId }: { bookId: string; book?: WishlistItem['book'] }) => {
      const response = await api.post(`/library/wishlist/${bookId}`)
      return wishlistItemSchema.parse(response.data)
    },
    onMutate: async ({ bookId, book }: { bookId: string; book?: WishlistItem['book'] }) => {
      await queryClient.cancelQueries({ queryKey: ['library', 'wishlist'] })
      const previous = queryClient.getQueryData<WishlistItem[]>(['library', 'wishlist']) || []
      if (!previous.some((item) => item.bookId === bookId)) {
        const optimistic: WishlistItem = {
          id: `optimistic-${bookId}`,
          userId: 'me',
          bookId,
          createdAt: new Date().toISOString(),
          book,
        }
        queryClient.setQueryData(['library', 'wishlist'], [optimistic, ...previous])
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['library', 'wishlist'], context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'wishlist'] })
    },
  })
}

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId }: { bookId: string; book?: FavoriteItem['book'] }) => {
      const response = await api.delete(`/library/wishlist/${bookId}`)
      return wishlistItemSchema.parse(response.data)
    },
    onMutate: async ({ bookId }: { bookId: string }) => {
      await queryClient.cancelQueries({ queryKey: ['library', 'wishlist'] })
      const previous = queryClient.getQueryData<WishlistItem[]>(['library', 'wishlist']) || []
      queryClient.setQueryData(
        ['library', 'wishlist'],
        previous.filter((item) => item.bookId !== bookId)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['library', 'wishlist'], context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'wishlist'] })
    },
  })
}

export const useAddToFavorites = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId }: { bookId: string; book?: FavoriteItem['book'] }) => {
      const response = await api.post(`/library/favorites/${bookId}`)
      return favoriteItemSchema.parse(response.data)
    },
    onMutate: async ({ bookId, book }: { bookId: string; book?: FavoriteItem['book'] }) => {
      await queryClient.cancelQueries({ queryKey: ['library', 'favorites'] })
      const previous = queryClient.getQueryData<FavoriteItem[]>(['library', 'favorites']) || []
      if (!previous.some((item) => item.bookId === bookId)) {
        const optimistic: FavoriteItem = {
          id: `optimistic-${bookId}`,
          userId: 'me',
          bookId,
          createdAt: new Date().toISOString(),
          book,
        }
        queryClient.setQueryData(['library', 'favorites'], [optimistic, ...previous])
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['library', 'favorites'], context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'favorites'] })
    },
  })
}

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId }: { bookId: string }) => {
      const response = await api.delete(`/library/favorites/${bookId}`)
      return favoriteItemSchema.parse(response.data)
    },
    onMutate: async ({ bookId }: { bookId: string }) => {
      await queryClient.cancelQueries({ queryKey: ['library', 'favorites'] })
      const previous = queryClient.getQueryData<FavoriteItem[]>(['library', 'favorites']) || []
      queryClient.setQueryData(
        ['library', 'favorites'],
        previous.filter((item) => item.bookId !== bookId)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['library', 'favorites'], context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'favorites'] })
    },
  })
}
