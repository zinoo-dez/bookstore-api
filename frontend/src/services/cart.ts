import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export interface CartItem {
  id: string
  bookId: string
  quantity: number
  book: {
    id: string
    title: string
    author: string
    price: number
    stock: number
    coverImage?: string | null
  }
}

export const useCart = () => {
  const { isAuthenticated } = useAuthStore()
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: async (): Promise<CartItem[]> => {
      const response = await api.get('/cart')
      return response.data.items || []
    },
    enabled: isAuthenticated,
  })
}

export const useAddToCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { bookId: string; quantity: number }) => {
      const response = await api.post('/cart', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, quantity }: { bookId: string; quantity: number }) => {
      const response = await api.patch(`/cart/${bookId}`, { quantity })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookId: string) => {
      await api.delete(`/cart/${bookId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}