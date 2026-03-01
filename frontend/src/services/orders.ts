import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Order {
  id: string
  userId: string
  deliveryType?: 'HOME_DELIVERY' | 'STORE_PICKUP'
  storeId?: string | null
  subtotalPrice?: number | string
  discountAmount?: number | string
  promoCode?: string | null
  totalPrice: number | string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  shippingFullName?: string | null
  shippingEmail?: string | null
  shippingPhone?: string | null
  shippingAddress?: string | null
  shippingCity?: string | null
  shippingState?: string | null
  shippingZipCode?: string | null
  shippingCountry?: string | null
  paymentProvider?: 'KPAY' | 'WAVEPAY' | 'MPU' | 'VISA' | null
  paymentReceiptUrl?: string | null
  createdAt: string
  pickupStore?: {
    id: string
    code: string
    name: string
    city: string
    state: string
    address?: string | null
  } | null
  user?: {
    id: string
    name: string
    email: string
  }
  orderItems: {
    id: string
    bookId: string
    format?: 'PHYSICAL' | 'EBOOK'
    quantity: number
    price: number | string
    book: {
      title: string
      author: string
      coverImage?: string | null
    }
  }[]
}

export interface WarehouseDeliveryTask {
  id: string
  staffId: string
  type: string
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  metadata?: Record<string, unknown> | null
  createdAt: string
  completedAt?: string | null
  staff: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    department: {
      id: string
      name: string
      code: string
    }
  }
  order?: {
    id: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    deliveryType?: 'HOME_DELIVERY' | 'STORE_PICKUP'
    createdAt: string
    user: {
      id: string
      name: string
      email: string
    }
    shippingFullName?: string | null
    shippingEmail?: string | null
    shippingPhone?: string | null
    shippingAddress?: string | null
    shippingCity?: string | null
    shippingState?: string | null
    shippingZipCode?: string | null
    shippingCountry?: string | null
    pickupStore?: {
      id: string
      code: string
      name: string
      city: string
      state: string
      address?: string | null
    } | null
    orderItems: Array<{
      id: string
      quantity: number
      book: {
        id: string
        title: string
        author: string
      }
    }>
  } | null
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

export const useAdminOrders = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async (): Promise<Order[]> => {
      const response = await api.get('/orders/admin/all')
      return response.data
    },
    enabled,
    retry: false,
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
    mutationFn: async (payload: {
      deliveryType?: 'HOME_DELIVERY' | 'STORE_PICKUP'
      storeId?: string
      fullName: string
      email: string
      phone: string
      address?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
      paymentProvider: 'KPAY' | 'WAVEPAY' | 'MPU' | 'VISA'
      paymentReceiptUrl: string
      promoCode?: string
    }) => {
      const response = await api.post('/orders', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export interface PromoValidationResult {
  valid: boolean
  code: string
  label?: string
  message: string
  subtotal: number
  discountAmount: number
  total: number
}

export const useValidatePromo = () => {
  return useMutation({
    mutationFn: async (code: string): Promise<PromoValidationResult> => {
      const response = await api.post('/orders/promotions/validate', { code })
      return response.data
    },
  })
}

export const useWarehouseDeliveryTasks = (status?: WarehouseDeliveryTask['status']) => {
  return useQuery({
    queryKey: ['warehouse-delivery-tasks', status || 'all'],
    queryFn: async (): Promise<WarehouseDeliveryTask[]> => {
      const response = await api.get('/orders/warehouse/delivery-tasks', {
        params: status ? { status } : undefined,
      })
      return response.data
    },
    retry: false,
  })
}

export const useCompleteWarehouseDeliveryTask = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.post(`/orders/warehouse/delivery-tasks/${taskId}/complete`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-delivery-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
}

export const useUploadPaymentReceipt = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/users/upload-payment-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    },
  })
}


export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' }) => {
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
    mutationFn: async (orderItems: { bookId: string; quantity: number; format?: 'PHYSICAL' | 'EBOOK' }[]) => {
      // Add all items to cart
      for (const item of orderItems) {
        await api.post('/cart', {
          ...item,
          format: item.format ?? 'PHYSICAL',
        })
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
