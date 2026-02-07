import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookReviews, useUpdateReview, useDeleteReview, type Review } from '@/services/reviews'
import { useAuthStore } from '@/store/auth.store'
import Loader from '@/components/ui/Loader'
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
        return <Loader size="sm" text="Loading reviews..." />
    }

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
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

    const getAvatarDisplay = (review: Review) => {
        if (review.user.avatarType === 'emoji' && review.user.avatarValue) {
            return (
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${review.user.backgroundColor || 'bg-gray-200'
                        }`}
                >
                    {review.user.avatarValue}
                </div>
            )
        }
        return (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                {review.user.name.charAt(0).toUpperCase()}
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
                        className="bg-white rounded-lg border p-4"
                    >
                        {editingReview?.id === review.id ? (
                            // Edit Mode
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                                            : 'text-gray-300'
                                                    }
                                                >
                                                    ★
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Comment
                                    </label>
                                    <textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
                                    {getAvatarDisplay(review)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div>
                                                <p className="font-medium text-gray-900">{review.user.name}</p>
                                                <div className="flex items-center gap-2">
                                                    {renderStars(review.rating)}
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            {user?.id === review.userId && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(review)}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(review.id)}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {review.comment && (
                                            <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
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
