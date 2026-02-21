import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type WarehouseAlertStatus = 'OPEN' | 'RESOLVED'
export type PurchaseRequestStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED'

export interface Warehouse {
  id: string
  name: string
  code: string
  city: string
  state: string
  address?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    stocks: number
    alerts: number
  }
}

export interface WarehouseStockRow {
  id: string
  warehouseId: string
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
    stock: number
  }
}

export interface WarehouseTransfer {
  id: string
  bookId: string
  fromWarehouseId: string
  toWarehouseId: string
  quantity: number
  note?: string | null
  createdByUserId?: string | null
  createdAt: string
  book: {
    id: string
    title: string
  }
  fromWarehouse: Warehouse
  toWarehouse: Warehouse
}

export interface WarehouseAlert {
  id: string
  warehouseId: string
  bookId: string
  stock: number
  threshold: number
  status: WarehouseAlertStatus
  createdAt: string
  resolvedAt?: string | null
  warehouse: Warehouse
  book: {
    id: string
    title: string
  }
}

export interface PurchaseRequest {
  id: string
  bookId: string
  warehouseId: string
  requestedByUserId: string
  quantity: number
  estimatedCost?: number | null
  approvedQuantity?: number | null
  approvedCost?: number | null
  reviewNote?: string | null
  status: PurchaseRequestStatus
  approvedByUserId?: string | null
  purchaseOrderId?: string | null
  approvedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  book: {
    id: string
    title: string
    author: string
  }
  warehouse: {
    id: string
    name: string
    code: string
  }
  requestedByUser: {
    id: string
    name: string
    email: string
  }
  approvedByUser?: {
    id: string
    name: string
    email: string
  } | null
}

export interface Vendor {
  id: string
  code: string
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  bookId: string
  orderedQuantity: number
  receivedQuantity: number
  unitCost?: number | null
  book: {
    id: string
    title: string
    author: string
  }
}

export interface PurchaseOrder {
  id: string
  vendorId: string
  warehouseId: string
  status: PurchaseOrderStatus
  createdByUserId: string
  approvedByUserId?: string | null
  expectedAt?: string | null
  sentAt?: string | null
  receivedAt?: string | null
  notes?: string | null
  totalCost?: number | null
  createdAt: string
  updatedAt: string
  vendor: Pick<Vendor, 'id' | 'code' | 'name' | 'isActive'>
  warehouse: Pick<Warehouse, 'id' | 'code' | 'name'>
  createdByUser: { id: string; name: string; email: string }
  approvedByUser?: { id: string; name: string; email: string } | null
  items: PurchaseOrderItem[]
  request?: {
    id: string
    status: PurchaseRequestStatus
    quantity: number
    approvedQuantity?: number | null
  } | null
}

export interface BookStockPresenceItem {
  bookId: string
  warehouseCount: number
}

export interface BookStockPresenceResponse {
  totalWarehouses: number
  byBook: BookStockPresenceItem[]
}

export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async (): Promise<Warehouse[]> => {
      const response = await api.get('/warehouses')
      return response.data
    },
    retry: false,
  })
}

export const useBookStockPresence = () => {
  return useQuery({
    queryKey: ['book-stock-presence'],
    queryFn: async (): Promise<BookStockPresenceResponse> => {
      const response = await api.get('/warehouses/book-stock-presence')
      return response.data
    },
    retry: false,
  })
}

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      code: string
      city: string
      state: string
      address?: string
      isActive?: boolean
    }): Promise<Warehouse> => {
      const response = await api.post('/warehouses', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

export const useUpdateWarehouse = () => {
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
        isActive: boolean
      }>
    }): Promise<Warehouse> => {
      const response = await api.patch(`/warehouses/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] })
    },
  })
}

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/warehouses/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] })
    },
  })
}

export const useWarehouseStocks = (warehouseId?: string) => {
  return useQuery({
    queryKey: ['warehouse-stocks', warehouseId],
    queryFn: async (): Promise<WarehouseStockRow[]> => {
      const response = await api.get(`/warehouses/${warehouseId}/stocks`)
      return response.data
    },
    enabled: !!warehouseId,
    retry: false,
  })
}

export const useSetWarehouseStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      warehouseId,
      bookId,
      stock,
      lowStockThreshold,
    }: {
      warehouseId: string
      bookId: string
      stock: number
      lowStockThreshold?: number
    }) => {
      const response = await api.put(`/warehouses/${warehouseId}/stocks/${bookId}`, {
        stock,
        lowStockThreshold,
      })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks', vars.warehouseId] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', vars.bookId] })
    },
  })
}

export const useTransferWarehouseStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      bookId: string
      fromWarehouseId: string
      toWarehouseId: string
      quantity: number
      note?: string
    }): Promise<WarehouseTransfer> => {
      const response = await api.post('/warehouses/transfer', payload)
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks', vars.fromWarehouseId] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks', vars.toWarehouseId] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', vars.bookId] })
    },
  })
}

export const useWarehouseAlerts = (status: WarehouseAlertStatus = 'OPEN') => {
  return useQuery({
    queryKey: ['warehouse-alerts', status],
    queryFn: async (): Promise<WarehouseAlert[]> => {
      const response = await api.get('/warehouses/alerts/low-stock', { params: { status } })
      return response.data
    },
    retry: false,
  })
}

export const useWarehouseTransfers = (limit = 20) => {
  return useQuery({
    queryKey: ['warehouse-transfers', limit],
    queryFn: async (): Promise<WarehouseTransfer[]> => {
      const response = await api.get('/warehouses/transfers', { params: { limit } })
      return response.data
    },
    retry: false,
  })
}

export const usePurchaseRequests = (filters?: { status?: PurchaseRequestStatus; warehouseId?: string }) => {
  return useQuery({
    queryKey: ['purchase-requests', filters?.status || 'all', filters?.warehouseId || 'all'],
    queryFn: async (): Promise<PurchaseRequest[]> => {
      const response = await api.get('/warehouses/purchase-requests', {
        params: filters,
      })
      return response.data
    },
    retry: false,
  })
}

export const useCreatePurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      bookId: string
      warehouseId: string
      quantity: number
      estimatedCost?: number
      reviewNote?: string
      submitForApproval?: boolean
    }) => {
      const response = await api.post('/warehouses/purchase-requests', payload)
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useSubmitPurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/warehouses/purchase-requests/${id}/submit`)
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useReviewPurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      action,
      approvedQuantity,
      approvedCost,
      reviewNote,
    }: {
      id: string
      action: 'APPROVE' | 'REJECT'
      approvedQuantity?: number
      approvedCost?: number
      reviewNote?: string
    }) => {
      const response = await api.patch(`/warehouses/purchase-requests/${id}/review`, {
        action,
        approvedQuantity,
        approvedCost,
        reviewNote,
      })
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useCompletePurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/warehouses/purchase-requests/${id}/complete`)
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useVendors = (activeOnly?: boolean) => {
  return useQuery({
    queryKey: ['vendors', activeOnly === undefined ? 'all' : activeOnly ? 'active' : 'inactive'],
    queryFn: async (): Promise<Vendor[]> => {
      const response = await api.get('/warehouses/vendors', {
        params: activeOnly === undefined ? undefined : { activeOnly },
      })
      return response.data
    },
    retry: false,
  })
}

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      code: string
      name: string
      contactName?: string
      email?: string
      phone?: string
      address?: string
      isActive?: boolean
    }): Promise<Vendor> => {
      const response = await api.post('/warehouses/vendors', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        code: string
        name: string
        contactName: string
        email: string
        phone: string
        address: string
        isActive: boolean
      }>
    }): Promise<Vendor> => {
      const response = await api.patch(`/warehouses/vendors/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/warehouses/vendors/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const usePurchaseOrders = (filters?: {
  status?: PurchaseOrderStatus
  warehouseId?: string
  vendorId?: string
}) => {
  return useQuery({
    queryKey: [
      'purchase-orders',
      filters?.status || 'all',
      filters?.warehouseId || 'all',
      filters?.vendorId || 'all',
    ],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const response = await api.get('/warehouses/purchase-orders', { params: filters })
      return response.data
    },
    retry: false,
  })
}

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      purchaseRequestId: string
      vendorId: string
      unitCost?: number
      expectedAt?: string
      notes?: string
    }): Promise<PurchaseOrder> => {
      const response = await api.post('/warehouses/purchase-orders', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useCreatePurchaseOrdersBatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      purchaseRequestIds: string[]
      vendorId: string
      unitCost?: number
      expectedAt?: string
      notes?: string
    }): Promise<{ createdCount: number; orders: PurchaseOrder[] }> => {
      const response = await api.post('/warehouses/purchase-orders/batch', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      note,
      closeWhenFullyReceived,
    }: {
      id: string
      note?: string
      closeWhenFullyReceived?: boolean
    }): Promise<PurchaseOrder> => {
      const response = await api.patch(`/warehouses/purchase-orders/${id}/receive`, {
        note,
        closeWhenFullyReceived,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
