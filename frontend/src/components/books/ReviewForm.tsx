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
            <div className="rounded-xl bg-blue-50/80 p-4 text-center dark:bg-blue-950/30">
                <p className="text-blue-800 dark:text-blue-200">Please log in to write a review</p>
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
            className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60"
        >
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Write a Review</h3>

            {/* Star Rating */}
            <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
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
                                        : 'text-slate-300 dark:text-slate-600'
                                }
                            >
                                ★
                            </span>
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 self-center text-sm text-slate-600 dark:text-slate-300">
                            {rating} star{rating !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Your Review (Optional)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200/50 bg-white/80 px-3 py-2 text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600/50 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                    maxLength={1000}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
