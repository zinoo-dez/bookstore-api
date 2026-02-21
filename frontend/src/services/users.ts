import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface User {
    id: string
    email: string
    name: string
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    createdAt: string
}

export interface UserStats {
    user: User
    stats: {
        totalOrders: number
        totalSpent: number
        completedOrders: number
        pendingOrders: number
    }
    recentOrders: Array<{
        id: string
        totalPrice: number | string
        status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
        createdAt: string
        orderItems: Array<{
            quantity: number
            book: {
                title: string
                author: string
            }
        }>
    }>
}

export interface UpdateUserPayload {
    userId: string
    data: {
        name?: string
        email?: string
        role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    }
}

export const useUsers = ({ enabled = true }: { enabled?: boolean } = {}) => {
    return useQuery({
        queryKey: ['admin-users'],
        queryFn: async (): Promise<User[]> => {
            const response = await api.get('/admin/users')
            return response.data
        },
        enabled,
        retry: false,
    })
}

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' }): Promise<User> => {
            const response = await api.patch(`/admin/users/${userId}/role`, { role })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })
}

export const useUpdateUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, data }: UpdateUserPayload): Promise<User> => {
            const response = await api.patch(`/admin/users/${userId}`, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })
}

export const useDeleteUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (userId: string): Promise<{ success: boolean }> => {
            const response = await api.delete(`/admin/users/${userId}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })
}

export const useUserStats = (userId: string) => {
    return useQuery({
        queryKey: ['user-stats', userId],
        queryFn: async (): Promise<UserStats> => {
            const response = await api.get(`/admin/users/${userId}/stats`)
            return response.data
        },
        enabled: !!userId,
    })
}
