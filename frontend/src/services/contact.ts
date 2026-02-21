import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { z } from 'zod'

const contactResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  email: z.string(),
  subject: z.string().optional().nullable(),
  message: z.string(),
  createdAt: z.string(),
})

const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  recipient: z.string(),
  subject: z.string(),
  body: z.string(),
  messageId: z.string().optional().nullable(),
  createdAt: z.string(),
})

export const createContactPayloadSchema = z.object({
  type: z.enum(['support', 'author', 'publisher', 'business', 'legal']),
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional(),
})

export type CreateContactPayload = z.infer<typeof createContactPayloadSchema>

export const useCreateContact = () => {
  return useMutation({
    mutationFn: async (payload: CreateContactPayload) => {
      const parsedPayload = createContactPayloadSchema.parse(payload)
      const response = await api.post('/api/contact', parsedPayload)
      return contactResponseSchema.parse(response.data)
    },
  })
}

export const useContactNotifications = (enabled = false) => {
  return useQuery({
    queryKey: ['contact', 'notifications'],
    queryFn: async () => {
      const response = await api.get('/api/contact/notifications')
      return z.array(notificationSchema).parse(response.data)
    },
    enabled,
  })
}
