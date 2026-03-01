import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  Book, 
  BooksResponse, 
  CreateBookData, 
  SearchBooksData,
  bookSchema,
  booksResponseSchema,
  createBookSchema 
} from '@/lib/schemas'
import { z } from 'zod'

export const useBooks = (params: SearchBooksData = {}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['books',params],
    queryFn: async (): Promise<BooksResponse> => {
      const response = await api.get('/books', { params })
      return booksResponseSchema.parse(response.data)
    },
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60,
  })
}

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async (): Promise<Book> => {
      const response = await api.get(`/books/${id}`)
      return bookSchema.parse(response.data)
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateBook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBookData): Promise<Book> => {
      const validatedData = createBookSchema.parse(data)
      const response = await api.post('/books', validatedData)
      return bookSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useUpdateBook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateBookData> }): Promise<Book> => {
      const response = await api.patch(`/books/${id}`, data)
      return bookSchema.parse(response.data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', data.id] })
    },
  })
}

export const useDeleteBook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Book> => {
      const response = await api.delete(`/books/${id}`)
      return bookSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const usePermanentDeleteBook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Book> => {
      const response = await api.delete(`/books/${id}/permanent`)
      return bookSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useEmptyBooksBin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<{ deleted: number }> => {
      const response = await api.delete('/books/bin/empty')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useRestoreBook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Book> => {
      const response = await api.patch(`/books/${id}/restore`)
      return bookSchema.parse(response.data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', data.id] })
    },
  })
}

export const useOutOfStockBooks = () => {
  return useQuery({
    queryKey: ['books', 'out-of-stock'],
    queryFn: async (): Promise<Book[]> => {
      const response = await api.get('/books/inventory/out-of-stock')
      return response.data.map((book: any) => bookSchema.parse(book))
    },
  })
}

export const useLowStockBooks = () => {
  return useQuery({
    queryKey: ['books', 'low-stock'],
    queryFn: async (): Promise<Book[]> => {
      const response = await api.get('/books/inventory/low-stock')
      return response.data.map((book: any) => bookSchema.parse(book))
    },
  })
}

export const usePopularBooks = (limit = 6) => {
  return useQuery({
    queryKey: ['books', 'popular', limit],
    queryFn: async (): Promise<Book[]> => {
      const response = await api.get('/books/popular', { params: { limit } })
      return z.array(bookSchema).parse(response.data)
    },
    staleTime: 1000 * 60 * 5,
  })
}

export const useRecommendedBooks = (limit = 6, enabled = true) => {
  return useQuery({
    queryKey: ['books', 'recommended', limit],
    queryFn: async (): Promise<Book[]> => {
      const response = await api.get('/books/recommended', { params: { limit } })
      return z.array(bookSchema).parse(response.data)
    },
    enabled,
    staleTime: 1000 * 60 * 3,
  })
}
