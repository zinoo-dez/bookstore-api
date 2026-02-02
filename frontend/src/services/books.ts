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

export const useBooks = (params: SearchBooksData = {}) => {
  return useQuery({
    queryKey: ['books', params],
    queryFn: async (): Promise<BooksResponse> => {
      const response = await api.get('/books', { params })
      return booksResponseSchema.parse(response.data)
    },
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
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/books/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
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