import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'

interface BookCoverProps {
  src?: string | null
  alt: string
  className?: string
  variant?: 'default' | 'physical'
}

const BookCover = ({ src, alt, className = '', variant = 'default' }: BookCoverProps) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const placeholderInitial = (alt?.trim()?.charAt(0) || 'B').toUpperCase()

  useEffect(() => {
    setImageError(false)
    setImageLoading(true)
  }, [src, variant])

  // Show placeholder if no src or image failed to load
  const showPlaceholder = !src || imageError

  if (variant === 'physical') {
    return (
      <div
        className={`
          group/book relative overflow-visible rounded-[2px] [transform-style:preserve-3d]
          transition-[transform,box-shadow] duration-500 ease-out
          shadow-[0_12px_24px_-8px_rgba(15,23,42,0.25),0_4px_8px_-4px_rgba(15,23,42,0.15)]
          hover:shadow-[0_28px_48px_-16px_rgba(15,23,42,0.35),0_12px_24px_-8px_rgba(15,23,42,0.25)]
          hover:[transform:perspective(1000px)_rotateY(-6deg)_rotateX(2deg)_translateY(-2px)]
          hover:scale-[1.02]
          ${className}
        `}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2px]">
          {showPlaceholder ? (
            <div className="relative grid h-full w-full place-items-center bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[8px] bg-gradient-to-r from-black/25 via-black/12 via-40% to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-[6px] w-[1px] bg-white/20" />
              <span className="text-[10px] font-black tracking-wide text-slate-600">{placeholderInitial}</span>
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
              )}
              <img
                src={src}
                alt={alt}
                className={`h-full w-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-[opacity,transform] duration-300`}
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
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[8px] bg-gradient-to-r from-black/35 via-black/18 via-40% to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-[6px] w-[1px] bg-white/10" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,rgba(255,255,255,0.18),rgba(255,255,255,0.05)_40%,transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 rounded-[2px] ring-1 ring-black/[0.02] dark:ring-white/[0.02]" />
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showPlaceholder ? (
        <div className="relative grid h-full w-full place-items-center bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300">
          <BookOpen className="h-3.5 w-3.5 text-slate-600/85" />
        </div>
      ) : (
        <>
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
          )}
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
