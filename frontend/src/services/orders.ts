import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Order {
  id: string
  userId: string
  totalPrice: number | string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
  }
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

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async (): Promise<Order[]> => {
      const response = await api.get('/orders/admin/all')
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
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
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
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.delete(`/orders/${orderId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
}

export const useReorder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderItems: { bookId: string; quantity: number }[]) => {
      // Add all items to cart
      for (const item of orderItems) {
        await api.post('/cart', item)
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

// Utility function to generate invoice
export const generateInvoice = (order: Order) => {
  const invoiceContent = `
INVOICE
=======

Order ID: ${order.id}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status}

ITEMS:
${order.orderItems.map((item, i) => `
${i + 1}. ${item.book.title}
   by ${item.book.author}
   Quantity: ${item.quantity} × $${Number(item.price).toFixed(2)} = $${(Number(item.price) * item.quantity).toFixed(2)}
`).join('')}

TOTAL: $${Number(order.totalPrice).toFixed(2)}

Thank you for your order!
  `.trim()

  const blob = new Blob([invoiceContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${order.id.slice(0, 8)}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
