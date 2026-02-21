import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'
import { bookSchema } from '@/lib/schemas'

export const readingStatusSchema = z.enum(['TO_READ', 'READING', 'FINISHED'])

const bookLiteSchema = bookSchema
  .omit({ inStock: true, stockStatus: true })
  .extend({
    inStock: z.boolean().optional(),
    stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']).optional(),
  })

const readingItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  status: readingStatusSchema,
  currentPage: z.number(),
  totalPages: z.number().nullable(),
  dailyGoalPages: z.number().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  progressPercent: z.number(),
  book: bookLiteSchema.optional(),
})

const readingSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  readingItemId: z.string().nullable(),
  pagesRead: z.number(),
  sessionDate: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  book: bookLiteSchema.optional(),
})

export type ReadingStatus = z.infer<typeof readingStatusSchema>
export type ReadingItem = z.infer<typeof readingItemSchema>
export type ReadingSession = z.infer<typeof readingSessionSchema>

export const useReadingItems = (params?: {
  status?: ReadingStatus
  bookId?: string
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: ['reading', params?.status ?? 'ALL', params?.bookId ?? 'ALL'],
    queryFn: async () => {
      const response = await api.get('/reading', {
        params: {
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.bookId ? { bookId: params.bookId } : {}),
        },
      })
      return z.array(readingItemSchema).parse(response.data)
    },
    enabled: params?.enabled ?? true,
  })
}

export const useReadingSessions = (params?: {
  month?: string
  bookId?: string
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: ['reading-sessions', params?.month ?? 'ALL', params?.bookId ?? 'ALL'],
    queryFn: async () => {
      const response = await api.get('/reading/sessions', {
        params: {
          ...(params?.month ? { month: params.month } : {}),
          ...(params?.bookId ? { bookId: params.bookId } : {}),
        },
      })
      return z.array(readingSessionSchema).parse(response.data)
    },
    enabled: params?.enabled ?? true,
  })
}

export const useTrackBook = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      status,
      currentPage,
      totalPages,
      dailyGoalPages,
    }: {
      bookId: string
      status?: ReadingStatus
      currentPage?: number
      totalPages?: number
      dailyGoalPages?: number
    }) => {
      const response = await api.post(`/reading/${bookId}`, {
        status,
        currentPage,
        totalPages,
        dailyGoalPages,
      })
      return readingItemSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading'] })
      queryClient.invalidateQueries({ queryKey: ['reading-sessions'] })
    },
  })
}

export const useUpdateReadingStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId, status }: { bookId: string; status: ReadingStatus }) => {
      const response = await api.patch(`/reading/${bookId}/status`, { status })
      return readingItemSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading'] })
      queryClient.invalidateQueries({ queryKey: ['reading-sessions'] })
    },
  })
}

export const useUpdateReadingProgress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      currentPage,
      totalPages,
    }: {
      bookId: string
      currentPage: number
      totalPages?: number
    }) => {
      const response = await api.patch(`/reading/${bookId}/progress`, {
        currentPage,
        totalPages,
      })
      return readingItemSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading'] })
      queryClient.invalidateQueries({ queryKey: ['reading-sessions'] })
    },
  })
}

export const useUpdateReadingGoal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      dailyGoalPages,
    }: {
      bookId: string
      dailyGoalPages?: number
    }) => {
      const response = await api.patch(`/reading/${bookId}/goal`, { dailyGoalPages })
      return readingItemSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading'] })
    },
  })
}

export const useRemoveTrackedBook = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.delete(`/reading/${bookId}`)
      return readingItemSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading'] })
    },
  })
}

export const useCreateReadingSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      pagesRead,
      sessionDate,
      notes,
    }: {
      bookId: string
      pagesRead: number
      sessionDate?: string
      notes?: string
    }) => {
      const response = await api.post(`/reading/${bookId}/sessions`, {
        pagesRead,
        sessionDate,
        notes,
      })
      return readingSessionSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['reading'] })
    },
  })
}

export const useUpdateReadingSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sessionId,
      pagesRead,
      sessionDate,
      notes,
    }: {
      sessionId: string
      pagesRead?: number
      sessionDate?: string
      notes?: string
    }) => {
      const response = await api.patch(`/reading/sessions/${sessionId}`, {
        pagesRead,
        sessionDate,
        notes,
      })
      return readingSessionSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['reading'] })
    },
  })
}
