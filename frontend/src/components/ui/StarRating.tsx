interface StarRatingProps {
    rating: number
    size?: 'sm' | 'md' | 'lg'
    showNumber?: boolean
    className?: string
}

const StarRating = ({ rating, size = 'md', showNumber = false, className = '' }: StarRatingProps) => {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
    }

    const roundedRating = Math.round(rating * 2) / 2 // Round to nearest 0.5

    const renderStar = (index: number) => {
        const starValue = index + 1
        if (roundedRating >= starValue) {
            return '★' // Full star
        } else if (roundedRating >= starValue - 0.5) {
            return '⯨' // Half star (or you can use a different character)
        } else {
            return '☆' // Empty star
        }
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className={`flex ${sizeClasses[size]}`}>
                {[0, 1, 2, 3, 4].map((index) => (
                    <span
                        key={index}
                        className={roundedRating > index ? 'text-yellow-400' : 'text-gray-300'}
                    >
                        {renderStar(index)}
                    </span>
                ))}
            </div>
            {showNumber && (
                <span className="text-sm text-gray-600 ml-1">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    )
}

export default StarRating
