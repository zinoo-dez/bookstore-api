import { useState } from 'react'

interface BookCoverProps {
  src?: string | null
  alt: string
  className?: string
}

const BookCover = ({ src, alt, className = '' }: BookCoverProps) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Show placeholder if no src or image failed to load
  const showPlaceholder = !src || imageError

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showPlaceholder ? (
        // Placeholder with icon
        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <span className="text-4xl">📖</span>
        </div>
      ) : (
        <>
          {/* Loading placeholder */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center animate-pulse">
              <span className="text-4xl">📖</span>
            </div>
          )}
          {/* Actual image */}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={(event) => {
              const img = event.currentTarget
              if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                setImageError(true)
              }
              setImageLoading(false)
            }}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
          />
        </>
      )}
    </div>
  )
}

export default BookCover
