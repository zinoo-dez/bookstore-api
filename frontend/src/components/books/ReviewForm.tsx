import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCreateReview } from '@/services/reviews'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'

interface ReviewFormProps {
    bookId: string
    onSuccess?: () => void
}

const ReviewForm = ({ bookId, onSuccess }: ReviewFormProps) => {
    const { user } = useAuthStore()
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [comment, setComment] = useState('')
    const createReview = useCreateReview()

    if (!user) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-800">Please log in to write a review</p>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0) {
            alert('Please select a rating')
            return
        }

        try {
            await createReview.mutateAsync({
                bookId,
                rating,
                comment: comment.trim() || undefined,
            })
            setRating(0)
            setComment('')
            onSuccess?.()
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit review')
        }
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border p-6"
        >
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

            {/* Star Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                        >
                            <span
                                className={
                                    star <= (hoveredRating || rating)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                }
                            >
                                ★
                            </span>
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-600 self-center">
                            {rating} star{rating !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review (Optional)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                    {comment.length}/1000 characters
                </p>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={createReview.isPending || rating === 0}
                className="w-full"
            >
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
        </motion.form>
    )
}

export default ReviewForm
