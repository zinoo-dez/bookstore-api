import { useEffect, useMemo, useRef } from 'react'
import type { Book } from '@/lib/schemas'
import BookSlideCard from '@/components/books/BookSlideCard'
import Skeleton from '@/components/ui/Skeleton'

interface BookCarouselProps {
  books?: Book[]
  isLoading?: boolean
  showArrows?: boolean
}

const BookCarousel = ({
  books = [],
  isLoading = false,
  showArrows = true,
}: BookCarouselProps) => {
  const railRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<HTMLDivElement[]>([])
  const segments = 3
  const displayBooks = useMemo(() => {
    if (books.length === 0) return []
    return Array.from({ length: segments }, () => books).flat()
  }, [books])

  const scrollRail = (direction: number) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  useEffect(() => {
    itemRefs.current = []
  }, [displayBooks])

  useEffect(() => {
    const rail = railRef.current
    if (!rail || displayBooks.length === 0) return

    const updateScales = () => {
      const railRect = rail.getBoundingClientRect()
      const centerX = railRect.left + railRect.width / 2

      itemRefs.current.forEach((item) => {
        if (!item) return
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.left + rect.width / 2
        const distance = Math.abs(centerX - itemCenter)
        const maxDistance = railRect.width * 0.5
        const clamped = Math.min(distance, maxDistance)
        const t = 1 - clamped / maxDistance
        const scale = 0.78 + t * 0.3
        const translateY = 12 - t * 12
        item.style.transform = `scale(${scale}) translateY(${translateY}px)`
        item.style.zIndex = `${Math.round(t * 10)}`
        item.style.opacity = `${0.6 + t * 0.4}`
      })
    }

    const handleScroll = () => {
      const segmentWidth = rail.scrollWidth / segments
      if (rail.scrollLeft <= segmentWidth * 0.05) {
        rail.scrollLeft += segmentWidth
      } else if (rail.scrollLeft >= segmentWidth * 1.95) {
        rail.scrollLeft -= segmentWidth
      }
      requestAnimationFrame(updateScales)
    }

    const handleResize = () => requestAnimationFrame(updateScales)

    const segmentWidth = rail.scrollWidth / segments
    rail.scrollLeft = segmentWidth
    updateScales()

    rail.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      rail.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [displayBooks])

  return (
    <div className="relative">
      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full border border-white/40 bg-white/70 p-2 text-slate-600 shadow-lg backdrop-blur transition hover:bg-white/90"
            aria-label="Scroll left"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            className="absolute right-0 top-1/2 z-10 translate-x-4 -translate-y-1/2 rounded-full border border-white/40 bg-white/70 p-2 text-slate-600 shadow-lg backdrop-blur transition hover:bg-white/90"
            aria-label="Scroll right"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </>
      )}

      <div
        ref={railRef}
        className="no-scrollbar flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth snap-x snap-mandatory"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="w-44 snap-center sm:w-52">
                <Skeleton className="mb-4 aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="mx-auto h-4 w-4/5" />
              </div>
            ))
          : displayBooks.map((book, index) => (
              <div
                key={`${book.id}-${index}`}
                ref={(el) => {
                  if (el) itemRefs.current[index] = el
                }}
                className="snap-center transition-transform duration-500 ease-out"
              >
                <BookSlideCard book={book} />
              </div>
            ))}
      </div>
    </div>
  )
}

export default BookCarousel
