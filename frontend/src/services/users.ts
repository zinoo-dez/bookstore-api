import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface User {
    id: string
    email: string
    name: string
    role: 'USER' | 'ADMIN'
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
        status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
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

export const useUsers = () => {
    return useQuery({
        queryKey: ['admin-users'],
        queryFn: async (): Promise<User[]> => {
            const response = await api.get('/admin/users')
            return response.data
        },
    })
}

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: 'USER' | 'ADMIN' }): Promise<User> => {
            const response = await api.patch(`/admin/users/${userId}/role`, { role })
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
