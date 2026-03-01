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

const ebookProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  page: z.number(),
  locationCfi: z.string().nullable(),
  percent: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ebookBookmarkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  page: z.number(),
  locationCfi: z.string().nullable(),
  label: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ebookNoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  page: z.number().nullable(),
  locationCfi: z.string().nullable(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ebookHighlightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  page: z.number().nullable(),
  startCfi: z.string(),
  endCfi: z.string().nullable(),
  textSnippet: z.string().nullable(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ebookStateSchema = z.object({
  book: bookLiteSchema.extend({
    isDigital: z.boolean().optional(),
    ebookFormat: z.enum(['EPUB', 'PDF']).nullable().optional(),
    ebookFilePath: z.string().nullable().optional(),
    totalPages: z.number().nullable().optional(),
  }),
  progress: ebookProgressSchema.nullable(),
  bookmarks: z.array(ebookBookmarkSchema),
  notes: z.array(ebookNoteSchema),
  highlights: z.array(ebookHighlightSchema),
})

const ebookOpenResponseSchema = z.object({
  bookId: z.string(),
  title: z.string(),
  ebookFormat: z.enum(['EPUB', 'PDF']).nullable(),
  totalPages: z.number().nullable(),
  progress: ebookProgressSchema.nullable(),
  token: z.string(),
  contentUrl: z.string(),
  expiresAt: z.string(),
})

const myEbookSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  sourceOrderId: z.string().nullable(),
  grantedAt: z.string(),
  book: bookLiteSchema.extend({
    isDigital: z.boolean().optional(),
    ebookFormat: z.enum(['EPUB', 'PDF']).nullable().optional(),
    ebookFilePath: z.string().nullable().optional(),
    totalPages: z.number().nullable().optional(),
    ebookPrice: z.number().nullable().optional(),
  }),
  progress: ebookProgressSchema.nullable(),
})

export type ReadingStatus = z.infer<typeof readingStatusSchema>
export type ReadingItem = z.infer<typeof readingItemSchema>
export type ReadingSession = z.infer<typeof readingSessionSchema>
export type EbookState = z.infer<typeof ebookStateSchema>
export type EbookOpenResponse = z.infer<typeof ebookOpenResponseSchema>
export type MyEbook = z.infer<typeof myEbookSchema>

const logMutationError = (scope: string, error: unknown) => {
  console.error(`[reading] ${scope} failed`, error)
}

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
    staleTime: 1000 * 60,
    placeholderData: (previousData) => previousData,
  })
}

export const useMyEbooks = (enabled = true) => {
  return useQuery({
    queryKey: ['reading-ebooks'],
    queryFn: async () => {
      const response = await api.get('/reading/ebooks')
      return z.array(myEbookSchema).parse(response.data)
    },
    enabled,
    staleTime: 1000 * 60,
    placeholderData: (previousData) => previousData,
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
    staleTime: 1000 * 60,
    placeholderData: (previousData) => previousData,
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

export const useOpenEbook = (bookId: string, enabled = true) => {
  return useQuery({
    queryKey: ['ebook-open', bookId],
    queryFn: async () => {
      const response = await api.get(`/reading/ebook/${bookId}/open`)
      return ebookOpenResponseSchema.parse(response.data)
    },
    enabled: enabled && !!bookId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export const useEbookState = (bookId: string, enabled = true) => {
  return useQuery({
    queryKey: ['ebook-state', bookId],
    queryFn: async () => {
      const response = await api.get(`/reading/ebook/${bookId}/state`)
      return ebookStateSchema.parse(response.data)
    },
    enabled: enabled && !!bookId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 10,
  })
}

export const useUpdateEbookProgress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      page,
      locationCfi,
      percent,
    }: {
      bookId: string
      page?: number
      locationCfi?: string
      percent?: number
    }) => {
      const response = await api.patch(`/reading/ebook/${bookId}/progress`, {
        page,
        locationCfi,
        percent,
      })
      return ebookProgressSchema.parse(response.data)
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['ebook-state', variables.bookId] })
      const previousState = queryClient.getQueryData<EbookState>(['ebook-state', variables.bookId])

      if (previousState) {
        queryClient.setQueryData<EbookState>(['ebook-state', variables.bookId], {
          ...previousState,
          progress: {
            ...(previousState.progress ?? {
              id: 'temp',
              userId: '',
              bookId: variables.bookId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
            page: variables.page ?? previousState.progress?.page ?? 1,
            locationCfi:
              typeof variables.locationCfi === 'string'
                ? variables.locationCfi
                : previousState.progress?.locationCfi ?? null,
            percent:
              typeof variables.percent === 'number'
                ? variables.percent
                : previousState.progress?.percent ?? 0,
            updatedAt: new Date().toISOString(),
          },
        })
      }

      return { previousState }
    },
    onError: (error, variables, context) => {
      logMutationError('updateEbookProgress', error)
      if (context?.previousState) {
        queryClient.setQueryData(['ebook-state', variables.bookId], context.previousState)
      }
    },
    onSuccess: (progress, variables) => {
      // Keep reader state stable during page turns; avoid hard refetch on every relocation.
      queryClient.setQueryData<EbookState | undefined>(
        ['ebook-state', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            progress,
          }
        },
      )
      queryClient.setQueryData<EbookOpenResponse | undefined>(
        ['ebook-open', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            progress,
          }
        },
      )
    },
  })
}

export const useCreateEbookBookmark = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      page,
      locationCfi,
      label,
    }: {
      bookId: string
      page: number
      locationCfi?: string
      label?: string
    }) => {
      const response = await api.post(`/reading/ebook/${bookId}/bookmarks`, {
        page,
        locationCfi,
        label,
      })
      return ebookBookmarkSchema.parse(response.data)
    },
    onSuccess: (bookmark, variables) => {
      queryClient.setQueryData<EbookState | undefined>(
        ['ebook-state', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            bookmarks: [bookmark, ...current.bookmarks.filter((item) => item.id !== bookmark.id)],
          }
        },
      )
    },
  })
}

export const useDeleteEbookBookmark = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: {
      bookId: string
      bookmarkId: string
    }) => {
      const response = await api.delete(
        `/reading/ebook/bookmarks/${variables.bookmarkId}`,
      )
      return ebookBookmarkSchema.parse(response.data)
    },
    onSuccess: (deletedBookmark, variables) => {
      queryClient.setQueryData<EbookState | undefined>(
        ['ebook-state', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            bookmarks: current.bookmarks.filter((item) => item.id !== (deletedBookmark.id || variables.bookmarkId)),
          }
        },
      )
    },
    onError: (error) => {
      logMutationError('deleteEbookBookmark', error)
    },
  })
}

export const useCreateEbookNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      page,
      locationCfi,
      content,
    }: {
      bookId: string
      page?: number
      locationCfi?: string
      content: string
    }) => {
      const response = await api.post(`/reading/ebook/${bookId}/notes`, {
        page,
        locationCfi,
        content,
      })
      return ebookNoteSchema.parse(response.data)
    },
    onSuccess: (note, variables) => {
      queryClient.setQueryData<EbookState | undefined>(
        ['ebook-state', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            notes: [note, ...current.notes.filter((item) => item.id !== note.id)],
          }
        },
      )
    },
  })
}

export const useDeleteEbookNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: {
      bookId: string
      noteId: string
    }) => {
      const response = await api.delete(`/reading/ebook/notes/${variables.noteId}`)
      return ebookNoteSchema.parse(response.data)
    },
    onSuccess: (deletedNote, variables) => {
      queryClient.setQueryData<EbookState | undefined>(
        ['ebook-state', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            notes: current.notes.filter((item) => item.id !== (deletedNote.id || variables.noteId)),
          }
        },
      )
    },
    onError: (error) => {
      logMutationError('deleteEbookNote', error)
    },
  })
}

export const useCreateEbookHighlight = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookId,
      page,
      startCfi,
      endCfi,
      textSnippet,
      color,
    }: {
      bookId: string
      page?: number
      startCfi: string
      endCfi?: string
      textSnippet?: string
      color?: string
    }) => {
      const response = await api.post(`/reading/ebook/${bookId}/highlights`, {
        page,
        startCfi,
        endCfi,
        textSnippet,
        color,
      })
      return ebookHighlightSchema.parse(response.data)
    },
    onSuccess: (highlight, variables) => {
      queryClient.setQueryData<EbookState | undefined>(
        ['ebook-state', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            highlights: [highlight, ...current.highlights.filter((item) => item.id !== highlight.id)],
          }
        },
      )
    },
  })
}

export const useDeleteEbookHighlight = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: {
      bookId: string
      highlightId: string
    }) => {
      const response = await api.delete(
        `/reading/ebook/highlights/${variables.highlightId}`,
      )
      return ebookHighlightSchema.parse(response.data)
    },
    onSuccess: (deletedHighlight, variables) => {
      queryClient.setQueryData<EbookState | undefined>(
        ['ebook-state', variables.bookId],
        (current) => {
          if (!current) return current
          return {
            ...current,
            highlights: current.highlights.filter((item) => item.id !== (deletedHighlight.id || variables.highlightId)),
          }
        },
      )
    },
    onError: (error) => {
      logMutationError('deleteEbookHighlight', error)
    },
  })
}
