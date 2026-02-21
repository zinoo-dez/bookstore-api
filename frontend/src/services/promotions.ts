import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type PromotionDiscountType = 'PERCENT' | 'FIXED'

export interface PromotionCode {
  id: string
  code: string
  name: string
  description?: string | null
  discountType: PromotionDiscountType
  discountValue: number | string
  minSubtotal: number | string
  maxDiscountAmount?: number | string | null
  startsAt?: string | null
  endsAt?: string | null
  maxRedemptions?: number | null
  redeemedCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const usePromotions = (activeOnly?: boolean) => {
  return useQuery({
    queryKey: ['admin-promotions', activeOnly ?? 'all'],
    queryFn: async (): Promise<PromotionCode[]> => {
      const response = await api.get('/admin/promotions', {
        params: activeOnly !== undefined ? { activeOnly } : undefined,
      })
      return response.data
    },
    retry: false,
  })
}

export const useCreatePromotion = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      code: string
      name: string
      description?: string
      discountType: PromotionDiscountType
      discountValue: number
      minSubtotal?: number
      maxDiscountAmount?: number
      startsAt?: string
      endsAt?: string
      maxRedemptions?: number
      isActive?: boolean
    }): Promise<PromotionCode> => {
      const response = await api.post('/admin/promotions', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] })
    },
  })
}

export const useUpdatePromotion = () => {
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
        description: string
        discountType: PromotionDiscountType
        discountValue: number
        minSubtotal: number
        maxDiscountAmount: number
        startsAt: string
        endsAt: string
        maxRedemptions: number
        isActive: boolean
      }>
    }): Promise<PromotionCode> => {
      const response = await api.patch(`/admin/promotions/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] })
    },
  })
}

export const useDeletePromotion = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/promotions/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] })
    },
  })
}
