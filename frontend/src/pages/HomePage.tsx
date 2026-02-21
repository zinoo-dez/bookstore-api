import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, Shuffle } from 'lucide-react'
import { useBooks, usePopularBooks, useRecommendedBooks } from '@/services/books'
import { useReadingItems, useReadingSessions } from '@/services/reading'
import { useAuthStore } from '@/store/auth.store'
import BookCarousel from '@/components/books/BookCarousel'
import BookCover from '@/components/ui/BookCover'
import BookCornerRibbon from '@/components/ui/BookCornerRibbon'
import PromoTicker from '@/components/ui/PromoTicker'

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const HomePage = () => {
  const navigate = useNavigate()
  const { data: booksData, isLoading } = useBooks({ limit: 12 })
  const { isAuthenticated } = useAuthStore()
  const { data: popularBooks, isLoading: isPopularLoading } = usePopularBooks(8)
  const { data: recommendedBooks, isLoading: isRecommendedLoading } = useRecommendedBooks(8, isAuthenticated)
  const { data: readingItems = [], isLoading: isReadingLoading } = useReadingItems({ enabled: isAuthenticated })
  const { data: readingSessions = [] } = useReadingSessions({ enabled: isAuthenticated })
  const [heroSearch, setHeroSearch] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [queueShuffleSeed, setQueueShuffleSeed] = useState(0)
  const [queueShuffleFxTick, setQueueShuffleFxTick] = useState(0)
  const [queueDeckHovered, setQueueDeckHovered] = useState(false)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroParallaxY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const heroParallaxYSoft = useTransform(scrollYProgress, [0, 1], [0, 52])
  const heroShellScale = useTransform(scrollYProgress, [0, 1], [1, 0.985])
  const pageProgressX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.35 })
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const tiltXSpring = useSpring(tiltX, { stiffness: 170, damping: 24, mass: 0.65 })
  const tiltYSpring = useSpring(tiltY, { stiffness: 170, damping: 24, mass: 0.65 })

  const readingNow = readingItems.filter((item) => item.status === 'READING')
  const toRead = readingItems.filter((item) => item.status === 'TO_READ')
  const finished = readingItems.filter((item) => item.status === 'FINISHED')
  const currentBook = readingNow[0]
  const sessionDateKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const session of readingSessions) {
      const sessionDate = new Date(session.sessionDate)
      if (Number.isNaN(sessionDate.getTime())) continue
      keys.add(toDateKey(sessionDate))
    }
    return keys
  }, [readingSessions])
  const statCells = useMemo(() => {
    return Array.from({ length: 28 }).map((_, idx) => {
      const day = new Date()
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - (27 - idx))
      return sessionDateKeys.has(toDateKey(day))
    })
  }, [sessionDateKeys])
  const shelfTotal = readingItems.length
  const completionRate = shelfTotal > 0
    ? Math.round((finished.length / shelfTotal) * 100)
    : 0
  const readingStreakDays = useMemo(() => {
    if (sessionDateKeys.size === 0) return 0
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    let count = 0
    while (sessionDateKeys.has(toDateKey(cursor))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [sessionDateKeys])
  type QueueBook = NonNullable<(typeof toRead)[number]['book']>
  const queuedBooks = toRead
    .map((item) => item.book)
    .filter((book): book is QueueBook => Boolean(book))
  const queuedPreviewBooks = queuedBooks.slice(0, 5)
  const queuedOverflowCount = Math.max(0, queuedBooks.length - queuedPreviewBooks.length)
  const queuedDeckBooks = useMemo(() => {
    if (queuedPreviewBooks.length === 0) return []
    const rotateBy = queueShuffleSeed % queuedPreviewBooks.length
    return [...queuedPreviewBooks.slice(rotateBy), ...queuedPreviewBooks.slice(0, rotateBy)]
  }, [queuedPreviewBooks, queueShuffleSeed])
  const trendingBooks = useMemo(() => {
    const merged = [...(popularBooks || []), ...(recommendedBooks || []), ...(booksData?.books || [])]
    return merged.filter((book, idx, arr) => arr.findIndex((x) => x.id === book.id) === idx).slice(0, 5)
  }, [popularBooks, recommendedBooks, booksData?.books])

  const handleHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = heroSearch.trim()
    navigate(query ? `/books?search=${encodeURIComponent(query)}` : '/books')
  }

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterEmail('')
  }

  const handleHeroCardMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height
    tiltX.set((0.5 - relativeY) * 12)
    tiltY.set((relativeX - 0.5) * 14)
  }

  const resetHeroCardTilt = () => {
    tiltX.set(0)
    tiltY.set(0)
  }

  const handleQueueShuffle = () => {
    if (queuedPreviewBooks.length < 2) return
    setQueueShuffleSeed((prev) => prev + 1)
    setQueueShuffleFxTick((prev) => prev + 1)
  }

  const sectionReveal = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, ease: 'easeOut' as const },
  }

  const staggerGroup = {
    initial: { opacity: 0, y: 24 },
    whileInView: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.06,
        ease: 'easeOut' as const,
      },
    },
    viewport: { once: true, amount: 0.2 },
  }

  const staggerChild = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' as const } },
  }

  return (
    <div className="tech-home min-h-screen text-slate-900 dark:text-slate-100">
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
        style={{ scaleX: pageProgressX }}
      />

      <div ref={heroRef} className="relative isolate overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-700/30"
          style={{ y: heroParallaxY }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-teal-300/35 blur-3xl dark:bg-teal-500/25"
          style={{ y: heroParallaxYSoft }}
        />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <PromoTicker className="mb-6" />

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ scale: heroShellScale }}
            className="surface-panel rounded-[36px] bg-white/75 p-8 dark:bg-slate-900/65"
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="section-kicker text-blue-700 dark:text-blue-300">Smart Discovery</p>
                <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                  Precision‑picked reads, ranked by what you love.
                </h1>
                <p className="mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                  Signal-driven curation blends editorial taste with real‑time trends to surface the right
                  book at the right moment.
                </p>
                <form onSubmit={handleHeroSearch} className="mt-6 flex flex-wrap gap-3">
                  <input
                    value={heroSearch}
                    onChange={(event) => setHeroSearch(event.target.value)}
                    placeholder="Search by title, author, or collection"
                    className="tech-input min-w-[220px] flex-1 rounded-full border border-slate-300 bg-white/95 px-4 py-2.5 text-sm text-slate-900 outline-none ring-0 transition"
                  />
                  <button
                    type="submit"
                    className="tech-primary rounded-full px-6 py-2.5 text-sm font-semibold"
                  >
                    <motion.span
                      className="inline-flex"
                      animate={{ y: [0, -2.5, 0] }}
                      transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      Search the library
                    </motion.span>
                  </button>
                  <Link
                    to="/books"
                    className="tech-secondary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
                  >
                    Browse catalog
                  </Link>
                </form>
                <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  <span>Trend‑weighted picks</span>
                  <span>Instant availability</span>
                  <span>Precision filters</span>
                </div>
              </div>

              <motion.div
                onMouseMove={handleHeroCardMouseMove}
                onMouseLeave={resetHeroCardTilt}
                onBlur={resetHeroCardTilt}
                style={{
                  rotateX: tiltXSpring,
                  rotateY: tiltYSpring,
                  transformPerspective: 1200,
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                className="tech-card rounded-3xl p-5 [transform-style:preserve-3d]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Discovery Stack</p>
                  <Link to="/books" className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
                    View all
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {trendingBooks.slice(0, 3).map((book, idx) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (idx * 0.08), duration: 0.36 }}
                    >
                      <Link
                        to={`/books/${book.id}`}
                        className="tech-card block rounded-2xl p-2"
                      >
                        <BookCover src={book.coverImage} alt={book.title} className="aspect-[2/3] w-full rounded-xl object-cover" />
                        <p className="mt-2 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{book.title}</p>
                        <p className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">{book.author}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Smart discovery adapts to your reading velocity, genre affinity, and live demand.
                </div>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            {...sectionReveal}
            className="mt-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Featured Books</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Precision-ranked highlights
                </h2>
              </div>
              <Link to="/books" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                View collection
              </Link>
            </div>
            <div className="mt-5">
              <BookCarousel
                books={booksData?.books || []}
                isLoading={isLoading}
                showArrows
              />
            </div>
          </motion.section>

          <motion.div
            {...staggerGroup}
            className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]"
          >
            <motion.div
              variants={staggerChild}
              className="surface-panel p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Best Seller</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {popularBooks?.[0]?.title || 'Top Seller This Week'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {popularBooks?.[0]?.author ? `by ${popularBooks?.[0]?.author}` : 'Reader favorite'}
                  </p>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {popularBooks?.[0]?.price ? `$${Number(popularBooks?.[0]?.price).toFixed(2)}` : ''}
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-[0.55fr_1fr]">
                <div className="tech-card p-4">
                  <div className="relative">
                    <BookCornerRibbon className="h-20 w-20" />
                  <BookCover
                    src={popularBooks?.[0]?.coverImage}
                    alt={popularBooks?.[0]?.title || 'Best seller'}
                    className="aspect-[2/3] w-full rounded-xl object-cover"
                  />
                  </div>
                </div>
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                  <p className="leading-relaxed">
                    {popularBooks?.[0]?.description ||
                      'A standout bestseller this week. Readers love its pacing, characters, and unforgettable payoff.'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>Top Rated</span>
                    <span>Bestseller</span>
                    <span>In Stock</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={popularBooks?.[0]?.id ? `/books/${popularBooks?.[0]?.id}` : '/books'}
                      className="tech-primary inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                    >
                      View details
                    </Link>
                    <Link
                      to="/books"
                      className="tech-secondary inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                    >
                      All best sellers
                    </Link>
                  </div>
                </div>
              </div>

              {isPopularLoading && (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  Loading best seller...
                </div>
              )}
            </motion.div>

            <motion.div
              variants={staggerChild}
              className="surface-panel p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Recommended</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">By Your Taste</h2>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {isAuthenticated ? 'Personalized' : 'Sign in for more'}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {(recommendedBooks || []).slice(0, 4).map((book) => (
                  <div
                    key={book.id}
                    className="tech-card group flex gap-3 p-3"
                  >
                    <BookCover
                      src={book.coverImage}
                      alt={book.title}
                      className="h-20 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {book.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">by {book.author}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        ${Number(book.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                {isRecommendedLoading && (
                  <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    Loading recommendations...
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <motion.section
            {...sectionReveal}
            className="surface-panel mt-10 rounded-[30px] p-5 text-slate-900 sm:p-7 dark:text-slate-100"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold tracking-tight">Your Reading Dashboard</h3>
              <Link to="/reading-insights" className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Reading Insights <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 sm:p-5 dark:border-white/12 dark:bg-white/[0.03]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-lg font-semibold">Currently Reading</p>
                <Link to="/reading-insights" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>

              {isReadingLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading your shelf...</p>
              ) : currentBook ? (
                <div className="flex items-center gap-4">
                  <div className="h-24 w-16 overflow-hidden rounded-lg border border-slate-300 dark:border-white/20">
                    <BookCover
                      src={currentBook.book?.coverImage ?? null}
                      alt={currentBook.book?.title || 'Current book'}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{currentBook.book?.title || 'Untitled'}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">{currentBook.book?.author || 'Unknown author'}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{currentBook.progressPercent}% completed</p>
                    <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/70">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all dark:bg-amber-300"
                        style={{ width: `${Math.min(100, Math.max(0, currentBook.progressPercent))}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    to={`/books/${currentBook.bookId}`}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:bg-white dark:text-slate-900"
                  >
                    {currentBook.progressPercent > 0 ? 'Continue' : 'Start Reading'}
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-500 dark:text-slate-400" />
                  <p className="mt-3 text-base font-medium">What are you reading right now?</p>
                  <Link
                    to="/books"
                    className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:bg-white dark:text-slate-900"
                  >
                    Select book(s)
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <motion.div
                className="tech-card rounded-2xl p-4"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-lg font-semibold">Want to Read</p>
                  <Link to="/reading-insights" className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {toRead.length > 0 ? `${toRead.length} books waiting` : 'No books waiting'}
                  </p>
                  <button
                    type="button"
                    onClick={handleQueueShuffle}
                    disabled={queuedPreviewBooks.length < 2}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-600 transition enabled:hover:border-slate-400 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:enabled:hover:bg-white/10"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Shuffle
                  </button>
                </div>
                {queuedDeckBooks.length > 0 ? (
                  <div className="mt-3">
                    <div
                      onMouseEnter={() => setQueueDeckHovered(true)}
                      onMouseLeave={() => setQueueDeckHovered(false)}
                      className="relative h-28 w-[220px]"
                    >
                      {queueShuffleFxTick > 0 && (
                        <motion.div
                          key={`queue-shuffle-fx-${queueShuffleFxTick}`}
                          initial={{ opacity: 0.55, scale: 0.82 }}
                          animate={{ opacity: 0, scale: 1.18 }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="pointer-events-none absolute inset-x-6 top-2 h-20 rounded-full bg-gradient-to-r from-cyan-300/55 via-sky-300/45 to-indigo-300/55 blur-xl dark:from-cyan-400/30 dark:via-sky-400/25 dark:to-indigo-400/30"
                        />
                      )}
                      {queuedDeckBooks.map((book, idx) => {
                        const centerOffset = idx - ((queuedDeckBooks.length - 1) / 2)
                        return (
                          <motion.div
                            key={`${book.id}-${queueShuffleSeed}`}
                            initial={{ opacity: 0, y: 18, rotate: -8 }}
                            animate={{
                              opacity: 1,
                              x: centerOffset * (queueDeckHovered ? 34 : 20),
                              y: queueDeckHovered ? Math.abs(centerOffset) * 2 : Math.abs(centerOffset) * 1.4,
                              rotate: centerOffset * (queueDeckHovered ? 10 : 6),
                              rotateY: centerOffset * (queueDeckHovered ? -7 : -3),
                              scale: queueDeckHovered && idx === queuedDeckBooks.length - 1 ? 1.04 : 1,
                            }}
                            whileHover={{ y: -8, scale: 1.07, rotateY: centerOffset * -9 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.75, delay: idx * 0.03 }}
                            className="absolute left-1/2 top-0 h-24 w-16 -translate-x-1/2 overflow-hidden rounded-md border border-slate-300 bg-white shadow-[0_8px_18px_-12px_rgba(15,23,42,0.45)] [transform-style:preserve-3d] dark:border-white/15 dark:bg-slate-900"
                            style={{ zIndex: idx + 1 }}
                          >
                            <Link
                              to={`/library?filter=TO_READ&selectedBookId=${encodeURIComponent(book.id)}`}
                              title={book.title}
                              className="block h-full w-full"
                            >
                              <BookCover src={book.coverImage} alt={book.title} className="h-full w-full" />
                            </Link>
                          </motion.div>
                        )
                      })}
                      {queuedOverflowCount > 0 && (
                        <div className="absolute right-0 top-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-slate-800 dark:text-slate-200">
                          +{queuedOverflowCount}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Shuffling deck preview
                      </p>
                      <Link to="/library?filter=TO_READ" className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                        Open queue
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Add titles to your queue to organize upcoming reads.
                  </p>
                )}
              </motion.div>

              <Link
                to="/reading-insights"
                className="tech-card rounded-2xl p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-lg font-semibold">Stats</p>
                  <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>Finished {finished.length} books</p>
                  <p className="text-right">{completionRate}% completion</p>
                  <p>{readingStreakDays}-day streak</p>
                  <p className="text-right">{shelfTotal} tracked</p>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {statCells.map((active, idx) => (
                    <div
                      key={`home-stat-${idx}`}
                      style={active ? { animationDelay: `${idx * 0.08}s` } : undefined}
                      className={
                        active
                          ? 'stat-cell-active h-5 rounded bg-teal-500/80 dark:bg-teal-300'
                          : 'h-5 rounded bg-slate-300 dark:bg-slate-600/50'
                      }
                    />
                  ))}
                </div>
              </Link>
            </div>
          </motion.section>


          <motion.section
            {...sectionReveal}
            className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-900/90 px-6 py-4 text-white shadow-[0_16px_36px_-30px_rgba(15,23,42,0.65)] dark:border-slate-700/80"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Signal Alerts</p>
                <p className="mt-1 text-sm text-slate-400">Get releases, restocks, and picks tailored to your reading list.</p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className="flex w-full flex-wrap gap-3 lg:w-auto">
                <input
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  type="email"
                  placeholder="Enter your email"
                  className="tech-input min-w-[220px] flex-1 rounded-xl border border-slate-500 bg-white/95 px-4 py-2 text-sm text-slate-900 outline-none ring-0 transition lg:w-80"
                />
                <button type="submit" className="tech-primary rounded-xl px-5 py-2 text-sm font-semibold">
                  Get alerts
                </button>
              </form>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

export default HomePage
