import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { bookSchema, booksResponseSchema, createBookSchema } from '@/lib/schemas';
export const useBooks = (params = {}) => {
    return useQuery({
        queryKey: ['books', params],
        queryFn: async () => {
            const response = await api.get('/books', { params });
            return booksResponseSchema.parse(response.data);
        },
    });
};
export const useBook = (id) => {
    return useQuery({
        queryKey: ['book', id],
        queryFn: async () => {
            const response = await api.get(`/books/${id}`);
            return bookSchema.parse(response.data);
        },
        enabled: !!id,
    });
};
export const useCreateBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const validatedData = createBookSchema.parse(data);
            const response = await api.post('/books', validatedData);
            return bookSchema.parse(response.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};
export const useUpdateBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.patch(`/books/${id}`, data);
            return bookSchema.parse(response.data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['book', data.id] });
        },
    });
};
export const useDeleteBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/books/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};
export const useOutOfStockBooks = () => {
    return useQuery({
        queryKey: ['books', 'out-of-stock'],
        queryFn: async () => {
            const response = await api.get('/books/inventory/out-of-stock');
            return response.data.map((book) => bookSchema.parse(book));
        },
    });
};
export const useLowStockBooks = () => {
    return useQuery({
        queryKey: ['books', 'low-stock'],
        queryFn: async () => {
            const response = await api.get('/books/inventory/low-stock');
            return response.data.map((book) => bookSchema.parse(book));
        },
    });
};
//# sourceMappingURL=books.js.map