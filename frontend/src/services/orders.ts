import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Order {
  id: string
  userId: string
  totalPrice: number | string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  orderItems: {
    id: string
    bookId: string
    quantity: number
    price: number | string
    book: {
      title: string
      author: string
      coverImage?: string | null
    }
  }[]
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      const response = await api.get('/orders')
      return response.data
    },
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async (): Promise<Order> => {
      const response = await api.get(`/orders/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/orders')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}


export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: 'PENDING' | 'COMPLETED' | 'CANCELLED' }) => {
      const response = await api.patch(`/orders/${orderId}/status`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
