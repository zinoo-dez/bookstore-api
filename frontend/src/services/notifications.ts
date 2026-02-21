import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type NotificationType =
  | 'support_reply'
  | 'announcement'
  | 'inquiry_update'
  | 'system'
  | 'blog_like'
  | 'blog_comment'
  | 'blog_follow'
  | 'inquiry_created'
  | 'inquiry_assigned'
  | 'inquiry_escalated'
  | 'inquiry_reply'

export interface UserNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationsListResponse {
  items: UserNotification[]
  total: number
  page: number
  limit: number
  unreadCount: number
}

export interface NotificationsQuery {
  page?: number
  limit?: number
  unreadOnly?: boolean
  type?: NotificationType
}

export const useNotifications = (
  query: NotificationsQuery = {},
  options?: { enabled?: boolean; poll?: boolean },
) => {
  const enabled = options?.enabled ?? true
  const poll = options?.poll ?? true

  return useQuery({
    queryKey: ['notifications', query],
    queryFn: async (): Promise<NotificationsListResponse> => {
      const response = await api.get('/notifications/me', { params: query })
      return response.data
    },
    enabled,
    refetchInterval: enabled && poll ? 30000 : false,
  })
}

export const useUnreadNotificationsCount = (enabled = true) =>
  useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async (): Promise<{ unreadCount: number }> => {
      const response = await api.get('/notifications/me/unread-count')
      return response.data
    },
    enabled,
    refetchInterval: enabled ? 30000 : false,
  })

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/notifications/${notificationId}/read`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export const useRemoveNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/me/read-all')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}
