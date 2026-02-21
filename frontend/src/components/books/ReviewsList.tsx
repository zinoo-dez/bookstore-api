import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookReviews, useUpdateReview, useDeleteReview, type Review } from '@/services/reviews'
import { useAuthStore } from '@/store/auth.store'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'

interface ReviewsListProps {
    bookId: string
}

const ReviewsList = ({ bookId }: ReviewsListProps) => {
    const { user } = useAuthStore()
    const { data: reviews, isLoading } = useBookReviews(bookId)
    const updateReview = useUpdateReview()
    const deleteReview = useDeleteReview()

    const [editingReview, setEditingReview] = useState<Review | null>(null)
    const [editRating, setEditRating] = useState(0)
    const [editComment, setEditComment] = useState('')
    const [hoveredRating, setHoveredRating] = useState(0)

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-6 w-28" />
                {[0, 1, 2].map((item) => (
                    <div key={item} className="rounded-xl bg-slate-50/80 p-4 dark:bg-[#081a40]/80">
                        <div className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!reviews || reviews.length === 0) {
        return (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-4xl mb-2">📝</p>
                <p>No reviews yet. Be the first to review this book!</p>
            </div>
        )
    }

    const handleEdit = (review: Review) => {
        setEditingReview(review)
        setEditRating(review.rating)
        setEditComment(review.comment || '')
    }

    const handleCancelEdit = () => {
        setEditingReview(null)
        setEditRating(0)
        setEditComment('')
    }

    const handleSaveEdit = async () => {
        if (!editingReview) return

        try {
            await updateReview.mutateAsync({
                reviewId: editingReview.id,
                bookId,
                rating: editRating,
                comment: editComment.trim() || undefined,
            })
            handleCancelEdit()
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update review')
        }
    }

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return

        try {
            await deleteReview.mutateAsync({ reviewId, bookId })
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete review')
        }
    }

    const getAvatarDisplay = () => {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            </div>
        )
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                    >
                        ★
                    </span>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">
                Reviews ({reviews.length})
            </h3>

            <AnimatePresence mode="popLayout">
                {reviews.map((review) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border-b border-slate-200/50 py-5 last:border-b-0 dark:border-slate-700/50"
                    >
                        {editingReview?.id === review.id ? (
                            // Edit Mode
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Rating
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setEditRating(star)}
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                className="text-2xl transition-transform hover:scale-110"
                                            >
                                                <span
                                                    className={
                                                        star <= (hoveredRating || editRating)
                                                            ? 'text-yellow-400'
                                                            : 'text-slate-300 dark:text-slate-600'
                                                    }
                                                >
                                                    ★
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Comment
                                    </label>
                                    <textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        rows={3}
                                        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        maxLength={1000}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveEdit}
                                        disabled={updateReview.isPending}
                                    >
                                        {updateReview.isPending ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex items-start gap-3">
                                    {getAvatarDisplay()}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{review.user.name}</p>
                                                <div className="flex items-center gap-2">
                                                    {renderStars(review.rating)}
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            {user?.id === review.userId && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(review)}
                                                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(review.id)}
                                                        className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {review.comment && (
                                            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{review.comment}</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

export default ReviewsList
