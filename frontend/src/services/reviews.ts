import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Review {
    id: string
    userId: string
    bookId: string
    rating: number
    comment?: string
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        avatarType?: string
        avatarValue?: string
        backgroundColor?: string
    }
}

export const useBookReviews = (bookId: string) => {
    return useQuery({
        queryKey: ['reviews', bookId],
        queryFn: async (): Promise<Review[]> => {
            const response = await api.get(`/books/${bookId}/reviews`)
            return response.data
        },
        enabled: !!bookId,
    })
}

export const useCreateReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            bookId,
            rating,
            comment,
        }: {
            bookId: string
            rating: number
            comment?: string
        }) => {
            const response = await api.post(`/books/${bookId}/reviews`, {
                rating,
                comment,
            })
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
        },
    })
}

export const useUpdateReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            reviewId,
            bookId: _bookId,
            rating,
            comment,
        }: {
            reviewId: string
            bookId: string
            rating?: number
            comment?: string
        }) => {
            const response = await api.patch(`/reviews/${reviewId}`, {
                rating,
                comment,
            })
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
        },
    })
}

export const useDeleteReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ reviewId, bookId: _bookId }: { reviewId: string; bookId: string }) => {
            await api.delete(`/reviews/${reviewId}`)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
        },
    })
}
