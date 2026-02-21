import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Book } from '@/lib/schemas'
import BookSlideCard from '@/components/books/BookSlideCard'
import Skeleton from '@/components/ui/Skeleton'

interface BookRailProps {
  title: string
  subtitle: string
  books?: Book[]
  isLoading?: boolean
  ctaLabel: string
  ctaHref: string
  loop?: boolean
}

const BookRail = ({
  title,
  subtitle,
  books = [],
  isLoading = false,
  ctaLabel,
  ctaHref,
  loop = false,
}: BookRailProps) => {
  const railRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<HTMLDivElement[]>([])

  const scrollRail = (direction: number) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  const displayBooks = loop ? [...books, ...books] : books

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    let rafId = 0
    const updateScales = () => {
      const railRect = rail.getBoundingClientRect()
      const centerX = railRect.left + railRect.width / 2

      itemRefs.current.forEach((item) => {
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.left + rect.width / 2
        const distance = Math.abs(centerX - itemCenter)
        const maxDistance = railRect.width * 0.45
        const clamped = Math.min(distance, maxDistance)
        const t = 1 - clamped / maxDistance
        const scale = 0.86 + t * 0.18
        const translateY = 10 - t * 10
        item.style.transform = `scale(${scale}) translateY(${translateY}px)`
        item.style.zIndex = `${Math.round(t * 10)}`
        item.style.opacity = `${0.65 + t * 0.35}`
      })
    }

    const onScroll = () => {
      if (loop) {
        const half = rail.scrollWidth / 2
        if (rail.scrollLeft >= half) {
          rail.scrollLeft -= half
        } else if (rail.scrollLeft <= 0) {
          rail.scrollLeft += half
        }
      }
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateScales)
    }

    updateScales()
    rail.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      rail.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    itemRefs.current = []
  }, [displayBooks])

  useEffect(() => {
    const rail = railRef.current
    if (!rail || displayBooks.length === 0) return
    const targetIndex = Math.floor(displayBooks.length / 4)
    const target = itemRefs.current[targetIndex]
    if (!target) return
    requestAnimationFrame(() => {
      const railRect = rail.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const offset = targetRect.left + targetRect.width / 2 - (railRect.left + railRect.width / 2)
      rail.scrollLeft += offset
      rail.dispatchEvent(new Event('scroll'))
    })
  }, [displayBooks])

  // Manual scroll only; no auto-looping.

  return (
    <section className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
            {subtitle}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={ctaHref}
            className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 hover:text-primary-700"
          >
            {ctaLabel}
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a1 1 0 011-1h9.586L10.3 5.714a1 1 0 011.4-1.428l5 5a1 1 0 010 1.428l-5 5a1 1 0 11-1.4-1.428L13.586 11H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollRail(-1)}
          className="absolute left-0 top-1/2 z-10 -translate-x-3 -translate-y-1/2 rounded-full border border-white/30 bg-slate-600/80 p-2 text-white shadow-lg backdrop-blur transition hover:bg-slate-500/90 dark:border-slate-700/60"
          aria-label="Scroll left"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollRail(1)}
          className="absolute right-0 top-1/2 z-10 translate-x-3 -translate-y-1/2 rounded-full border border-white/30 bg-slate-600/80 p-2 text-white shadow-lg backdrop-blur transition hover:bg-slate-500/90 dark:border-slate-700/60"
          aria-label="Scroll right"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div
          ref={railRef}
          className="no-scrollbar flex gap-5 overflow-x-auto pb-6 pr-2 scroll-smooth"
        >
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="w-56 sm:w-60">
                <Skeleton className="mb-4 h-56 w-full rounded-md" />
                <Skeleton className="mx-auto h-4 w-4/5" />
              </div>
            ))
          : displayBooks.map((book, index) => (
              <div
                key={`${book.id}-${index}`}
                ref={(el) => {
                  if (el) itemRefs.current[index] = el
                }}
                className="transition-transform duration-300"
              >
                <BookSlideCard book={book} />
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}

export default BookRail
