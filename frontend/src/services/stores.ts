import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Store {
  id: string
  name: string
  code: string
  city: string
  state: string
  address?: string | null
  phone?: string | null
  email?: string | null
  isActive: boolean
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  _count?: {
    stocks: number
    orders: number
    inboundTransfers: number
  }
}

export interface StoreStockRow {
  id: string
  storeId: string
  bookId: string
  stock: number
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
  book: {
    id: string
    title: string
    author: string
    isbn: string
    price: number | string
  }
}

export interface StoreTransfer {
  id: string
  bookId: string
  fromWarehouseId: string
  toStoreId: string
  quantity: number
  note?: string | null
  createdByUserId?: string | null
  createdAt: string
  book: { id: string; title: string; author: string }
  fromWarehouse: { id: string; code: string; name: string }
  toStore: { id: string; code: string; name: string }
}

export interface StoreSalesOverview {
  range: {
    from: string | null
    to: string | null
  }
  totals: {
    stores: number
    activeStores: number
    orders: number
    grossSales: number
    avgOrderValue: number
  }
  perStore: Array<{
    store: {
      id: string
      code: string
      name: string
      city: string
      state: string
      isActive: boolean
    }
    totalOrders: number
    completedOrders: number
    unitsSold: number
    grossSales: number
    avgOrderValue: number
    topBooks: Array<{
      bookId: string
      title: string
      author: string
      quantity: number
    }>
  }>
}

export const usePublicStores = () => {
  return useQuery({
    queryKey: ['public-stores'],
    queryFn: async (): Promise<Store[]> => {
      const response = await api.get('/stores/public')
      return response.data
    },
  })
}

export const useStores = (status: 'active' | 'trashed' | 'all' = 'active') => {
  return useQuery({
    queryKey: ['stores', status],
    queryFn: async (): Promise<Store[]> => {
      const response = await api.get('/stores', {
        params: { status },
      })
      return response.data
    },
    retry: false,
  })
}

export const useCreateStore = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      code: string
      city: string
      state: string
      address?: string
      phone?: string
      email?: string
      isActive?: boolean
    }): Promise<Store> => {
      const response = await api.post('/stores', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['public-stores'] })
    },
  })
}

export const useUpdateStore = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        name: string
        code: string
        city: string
        state: string
        address: string
        phone: string
        email: string
        isActive: boolean
      }>
    }): Promise<Store> => {
      const response = await api.patch(`/stores/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['public-stores'] })
      queryClient.invalidateQueries({ queryKey: ['store-sales-overview'] })
    },
  })
}

export const useDeleteStore = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/stores/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['public-stores'] })
      queryClient.invalidateQueries({ queryKey: ['store-sales-overview'] })
    },
  })
}

export const useRestoreStore = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/stores/${id}/restore`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['public-stores'] })
      queryClient.invalidateQueries({ queryKey: ['store-sales-overview'] })
    },
  })
}

export const usePermanentDeleteStore = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/stores/${id}/permanent`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['public-stores'] })
      queryClient.invalidateQueries({ queryKey: ['store-sales-overview'] })
    },
  })
}

export const useStoreStocks = (storeId?: string) => {
  return useQuery({
    queryKey: ['store-stocks', storeId],
    queryFn: async (): Promise<StoreStockRow[]> => {
      const response = await api.get(`/stores/${storeId}/stocks`)
      return response.data
    },
    enabled: !!storeId,
    retry: false,
  })
}

export const useSetStoreStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      storeId,
      bookId,
      stock,
      lowStockThreshold,
    }: {
      storeId: string
      bookId: string
      stock: number
      lowStockThreshold?: number
    }) => {
      const response = await api.put(`/stores/${storeId}/stocks/${bookId}`, {
        stock,
        lowStockThreshold,
      })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['store-stocks', vars.storeId] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', vars.bookId] })
    },
  })
}

export const useTransferToStore = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      fromWarehouseId: string
      toStoreId: string
      bookId: string
      quantity: number
      note?: string
    }): Promise<StoreTransfer> => {
      const response = await api.post('/stores/transfer-from-warehouse', payload)
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['store-stocks', vars.toStoreId] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['store-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks', vars.fromWarehouseId] })
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useStoreTransfers = (limit = 50) => {
  return useQuery({
    queryKey: ['store-transfers', limit],
    queryFn: async (): Promise<StoreTransfer[]> => {
      const response = await api.get('/stores/transfers/history', {
        params: { limit },
      })
      return response.data
    },
    retry: false,
  })
}

export const useStoreSalesOverview = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ['store-sales-overview', params?.from || '', params?.to || ''],
    queryFn: async (): Promise<StoreSalesOverview> => {
      const response = await api.get('/stores/sales/overview', {
        params,
      })
      return response.data
    },
    retry: false,
  })
}
