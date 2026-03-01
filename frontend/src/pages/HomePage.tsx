import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Check, ChevronRight, Shuffle } from 'lucide-react'
import { useBooks, usePopularBooks, useRecommendedBooks } from '@/services/books'
import { type Blog, useBlogs } from '@/services/blogs'
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

type HeroSlide = {
  id: string
  label: string
  title: string
  subtitle: string
  to: string
  image?: string | null
}

//Hero billboard
const CURATED_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'promo-new-arrivals',
    label: 'Promotion',
    title: 'New Arrival Week: Fresh titles just landed.',
    subtitle: 'Explore newly published books across fiction, productivity, and technology.',
    to: '/books?sort=newest',
  },
  {
    id: 'promo-author-blogs',
    label: 'Author Blogs',
    title: 'Go behind the pages with author stories and reading notes.',
    subtitle: 'Read blog posts from writers, discover insights, and follow your favorite voices.',
    to: '/blogs',
  },
  {
    id: 'promo-staff-picks',
    label: 'Staff Picks',
    title: 'Editor-curated picks for your next weekend read.',
    subtitle: 'collections chosen by our editorial team.',
    to: '/books?sort=popular',
  },
  {
  id: 'promo-blog-new',
  label: 'Author Blog',
  title: 'How to Build a Weekly Reading Workflow',
  subtitle: 'A practical post on planning reading sessions and keeping momentum.',
  to: '/blogs/8139dfd7-2fc9-4239-bfac-e0ccd1ee9b30',
  image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop',
},

]

const SUPPORT_FLOW_STEPS = [
  { id: 'step-ask', title: 'Ask', detail: 'Share your issue in one form' },
  { id: 'step-route', title: 'Route', detail: 'We triage by topic and urgency' },
  { id: 'step-reply', title: 'Reply', detail: 'Support responds in under 24h' },
  { id: 'step-resolve', title: 'Resolve', detail: 'Track updates until closed' },
]

const HomePage = () => {
  const navigate = useNavigate()
  const { data: booksData, isLoading } = useBooks({ limit: 12, status: 'active' })
  const { isAuthenticated } = useAuthStore()
  const { data: popularBooks, isLoading: isPopularLoading } = usePopularBooks(8)
  const { data: recommendedBooks, isLoading: isRecommendedLoading } = useRecommendedBooks(8, isAuthenticated)
  const { data: blogSpotlightFeed, isLoading: isBlogSpotlightLoading } = useBlogs({ tab: 'trending', page: 1, limit: 4 })
  const { data: readingItems = [], isLoading: isReadingLoading } = useReadingItems({ enabled: isAuthenticated })
  const { data: readingSessions = [] } = useReadingSessions({ enabled: isAuthenticated })
  const [heroSearch, setHeroSearch] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [queueShuffleSeed, setQueueShuffleSeed] = useState(0)
  const [queueShuffleFxTick, setQueueShuffleFxTick] = useState(0)
  const [queueDeckHovered, setQueueDeckHovered] = useState(false)
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const [activeBlogIndex, setActiveBlogIndex] = useState(0)
  const [supportAnimMs, setSupportAnimMs] = useState(0)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroParallaxY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const heroParallaxYSoft = useTransform(scrollYProgress, [0, 1], [0, 52])
  const heroShellScale = useTransform(scrollYProgress, [0, 1], [1, 0.985])
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
  const blogSpotlights = blogSpotlightFeed?.items ?? []
  const blogCarousel = useMemo(() => blogSpotlights.slice(0, 6), [blogSpotlights])
  const safeBlogIndex = blogCarousel.length > 0 ? activeBlogIndex % blogCarousel.length : 0
  const featuredBlog = blogCarousel[safeBlogIndex]
  const sidebarBlogs = useMemo(() => {
    if (blogCarousel.length <= 1) return []
    const count = Math.min(4, blogCarousel.length - 1)
    return Array.from({ length: count }, (_, offset) => blogCarousel[(safeBlogIndex + 1 + offset) % blogCarousel.length])
  }, [blogCarousel, safeBlogIndex])

  // Hero ads edit 
  const heroSlides = useMemo(() => {
    const fallbackCovers = trendingBooks.map((book) => book.coverImage).filter((cover): cover is string => Boolean(cover))

    if (CURATED_HERO_SLIDES.length === 0) {
      return [
        {
          id: 'fallback-discovery',
          label: 'Weekly Spotlight',
          title: 'Fresh arrivals and editor-led picks worth opening tonight.',
          subtitle: 'Discover limited-time offers, standout releases, and staff-curated reads in one stream.',
          to: '/books',
          image: fallbackCovers[0] ?? null,
        },
      ]
    }

    return CURATED_HERO_SLIDES.map((slide, idx) => ({
      ...slide,
      image: slide.image ?? fallbackCovers[idx % Math.max(1, fallbackCovers.length)] ?? null,
    }))
  }, [trendingBooks])

  const safeHeroIndex = heroSlides.length > 0 ? activeHeroIndex % heroSlides.length : 0
  const activeHeroSlide = heroSlides[safeHeroIndex]
  const supportNodeDuration = 1500
  const supportLineDuration = 1100
  const supportPauseDuration = 550
  const supportStepBlock = supportNodeDuration + supportLineDuration + supportPauseDuration
  const supportCycleDuration = SUPPORT_FLOW_STEPS.length * supportStepBlock
  const supportTime = supportAnimMs % supportCycleDuration
  const supportStepIndex = Math.floor(supportTime / supportStepBlock)
  const supportStepElapsed = supportTime % supportStepBlock
  const supportIsNodePhase = supportStepElapsed < supportNodeDuration
  const supportIsLinePhase =
    supportStepElapsed >= supportNodeDuration &&
    supportStepElapsed < supportNodeDuration + supportLineDuration
  const supportNodeProgress = Math.min(1, supportStepElapsed / supportNodeDuration)
  const supportLineProgress = supportIsLinePhase
    ? Math.min(1, (supportStepElapsed - supportNodeDuration) / supportLineDuration)
    : supportStepElapsed >= supportNodeDuration + supportLineDuration
      ? 1
      : 0
  const supportCompletedCount = Math.min(
    supportStepIndex + (supportStepElapsed >= supportNodeDuration ? 1 : 0),
    SUPPORT_FLOW_STEPS.length,
  )

  useEffect(() => {
    setActiveHeroIndex(0)
  }, [heroSlides.length])

  useEffect(() => {
    if (isHeroPaused || heroSlides.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroSlides.length)
    }, 5600)
    return () => window.clearInterval(timer)
  }, [isHeroPaused, heroSlides.length])

  useEffect(() => {
    setActiveBlogIndex(0)
  }, [blogCarousel.length])

  useEffect(() => {
    if (blogCarousel.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveBlogIndex((prev) => (prev + 1) % blogCarousel.length)
    }, 6400)
    return () => window.clearInterval(timer)
  }, [blogCarousel.length])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSupportAnimMs((prev) => (prev + 50) % supportCycleDuration)
    }, 50)
    return () => window.clearInterval(timer)
  }, [supportCycleDuration])

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
    <div className="luxe-shell min-h-screen text-slate-900 dark:text-slate-100">
      <div ref={heroRef} className="relative isolate">
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

        <div className="relative border-y border-slate-200/55 bg-transparent dark:border-white/10">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.46, ease: 'easeOut' }}
            className="relative min-h-[52vh] overflow-hidden border-b border-slate-200/35 text-white sm:min-h-[60vh] dark:border-white/10"
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
            onClick={() => {
              if (activeHeroSlide?.to) navigate(activeHeroSlide.to)
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`hero-slide-${activeHeroSlide?.id ?? 'fallback'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: activeHeroSlide?.image
                    ? `url(${activeHeroSlide.image})`
                    : 'linear-gradient(112deg,#10213f 0%,#16355f 44%,#1e4a74 100%)',
                }}
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,20,0.28),rgba(5,10,20,0.7))]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(5,10,20,0.82)_0%,rgba(8,17,34,0.74)_34%,rgba(7,14,27,0.3)_68%,rgba(7,14,27,0.06)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.14),rgba(255,255,255,0)_45%)]" />
            <div className="relative mx-auto flex h-full w-[min(96%,80rem)] items-end px-2 py-10 sm:px-4 sm:py-12 lg:px-6">
              <div className="grid w-full gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/90">
                    {activeHeroSlide?.label || 'Weekly Spotlight'}
                  </p>
                  <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
                    {activeHeroSlide?.title || 'Fresh arrivals and editor-led picks worth opening tonight.'}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm text-slate-100/85 sm:text-base">
                    {activeHeroSlide?.subtitle || 'Discover limited-time offers, standout releases, and staff-curated reads in one stream.'}
                  </p>
                </div>
              </div>
            </div>
            {heroSlides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/30 bg-black/25 px-3 py-1.5 backdrop-blur">
                <div className="flex items-center gap-1.5">
                  {heroSlides.map((slide, idx) => (
                    <button
                      key={`hero-dot-${slide.id}-${idx}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setActiveHeroIndex(idx)
                      }}
                      className={`h-2.5 rounded-full transition-all ${idx === safeHeroIndex ? 'w-5 bg-cyan-300' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.section>

          <div className="mx-auto w-[min(96%,80rem)] px-2 pb-10 pt-8 sm:px-4 lg:px-6">
            <PromoTicker className="mb-6" />

            <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ scale: heroShellScale }}
            className="luxe-panel section-reveal w-full rounded-[36px] p-7 sm:p-8"
          >
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
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
                className="luxe-card tone-hover-gold lift-3d rounded-3xl p-5"
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
                        className="luxe-card tone-hover-gold block rounded-2xl p-2"
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
          </div>
        </div>
        <div className="mx-auto w-[min(96%,80rem)] px-2 pb-14 pt-8 sm:px-4 lg:px-6">

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

          <motion.section
            {...sectionReveal}
            className="relative mt-10 w-screen overflow-hidden border-y border-slate-200/70 bg-[linear-gradient(115deg,rgba(12,22,41,0.95)_0%,rgba(17,33,61,0.92)_46%,rgba(24,49,79,0.9)_100%)] text-white [margin-left:calc(50%-50vw)] dark:border-white/10"
          >
            <div className="mx-auto w-[min(96%,80rem)]">
            <div className="grid min-h-[340px] lg:grid-cols-[1.2fr_0.8fr]">
              <Link
                to={featuredBlog ? `/blogs/${featuredBlog.id}` : '/blogs'}
                className="group relative overflow-hidden px-6 py-8 sm:px-8"
                style={{
                  backgroundImage: featuredBlog?.coverImage
                    ? `linear-gradient(98deg,rgba(2,6,23,0.84) 0%,rgba(2,6,23,0.68) 44%,rgba(2,6,23,0.2) 100%),url(${featuredBlog.coverImage})`
                    : 'linear-gradient(98deg,rgba(2,6,23,0.9) 0%,rgba(15,23,42,0.82) 52%,rgba(30,58,95,0.72) 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 top-0 h-full w-44 bg-white/10"
                  animate={{ rotate: [10, 14, 10], x: [0, 16, 0] }}
                  transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'top right', clipPath: 'polygon(20% 0%, 100% 0%, 60% 100%, 0% 100%)' }}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100/85">Blog Spotlight</p>
                <h3 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-white sm:text-5xl">
                  {featuredBlog?.title || 'Voices, ideas, and reading culture'}
                </h3>
                <p className="mt-4 max-w-2xl text-base text-slate-100/85">
                  {featuredBlog?.subtitle || 'Long-form stories, practical guides, and commentary from our reading ecosystem.'}
                </p>
                {featuredBlog && (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/75">
                    {featuredBlog.author.name} · {featuredBlog.readingTime} min
                  </p>
                )}
              </Link>

              <div className="relative border-t border-white/15 px-6 py-7 sm:px-7 lg:border-l lg:border-t-0">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200/75">Live Headlines</p>
                  <Link to="/blogs" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-100 transition hover:text-white">
                    Explore blogs <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {sidebarBlogs.length > 0 ? (
                    sidebarBlogs.map((post: Blog, idx) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.28, delay: idx * 0.06 }}
                        className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
                      >
                        <Link to={`/blogs/${post.id}`} className="block transition hover:translate-x-1">
                          <p className="line-clamp-2 text-lg font-semibold leading-tight text-white">{post.title}</p>
                          <p className="mt-1 text-sm text-slate-200/70">
                            {post.author.name} · {post.readingTime} min
                          </p>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-200/70">
                      {isBlogSpotlightLoading ? 'Loading latest blog highlights...' : 'No blog highlights yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            </div>
          </motion.section>

          <motion.section
            {...sectionReveal}
            className="relative mt-10 w-screen overflow-hidden bg-transparent py-8 [margin-left:calc(50%-50vw)]"
          >
            <div className="mx-auto w-[min(96%,80rem)] px-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Support Path</p>
            <h3 className="mt-2 font-display text-3xl text-slate-900 dark:text-slate-100">Get help fast with a clear response flow</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              From inquiry to resolution, every step is trackable and structured.
            </p>

            <div className="relative mt-7">
              <div className="grid gap-5 md:grid-cols-4">
                {SUPPORT_FLOW_STEPS.map((step, idx) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.3, delay: idx * 0.06 }}
                    className="relative"
                  >
                    {idx < SUPPORT_FLOW_STEPS.length - 1 && (
                      <div className="pointer-events-none absolute -right-10 left-5 top-5 hidden h-px bg-slate-300/70 dark:bg-white/15 md:block">
                        <motion.div
                          className="h-full origin-left bg-cyan-400 dark:bg-amber-300"
                          animate={{
                            scaleX:
                              supportStepIndex < idx
                                ? 0
                                : supportStepIndex > idx
                                  ? 1
                                  : supportLineProgress,
                          }}
                          transition={{ duration: 0.16, ease: 'linear' }}
                        />
                      </div>
                    )}

                    {(() => {
                      const isDone = idx < supportCompletedCount
                      const isActive = idx === supportStepIndex && supportIsNodePhase
                      const ringLength = 126
                      return (
                        <motion.div
                          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold shadow-[0_8px_20px_-14px_rgba(8,145,178,0.6)] ${
                            isDone
                              ? 'border-cyan-500 bg-cyan-500 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-900'
                              : 'border-cyan-300/70 bg-white/85 text-cyan-700 dark:border-cyan-400/40 dark:bg-white/10 dark:text-cyan-300'
                          }`}
                          animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                          transition={{ duration: 0.8, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
                        >
                          {isDone ? (
                            <motion.span
                              initial={{ scale: 0.45, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                            >
                              <Check className="h-4 w-4" />
                            </motion.span>
                          ) : (
                            <span>{idx + 1}</span>
                          )}

                          {isActive && (
                            <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden>
                              <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="2.8" className="text-cyan-400/25 dark:text-amber-300/30" />
                              <circle
                                cx="22"
                                cy="22"
                                r="20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.8"
                                strokeLinecap="round"
                                className="text-cyan-500 dark:text-amber-300"
                                strokeDasharray={ringLength}
                                strokeDashoffset={ringLength * (1 - supportNodeProgress)}
                              />
                            </svg>
                          )}
                        </motion.div>
                      )
                    })()}
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-slate-100">{step.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{step.detail}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            </div>
          </motion.section>

          <motion.div
            {...staggerGroup}
            className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]"
          >
            <motion.div
              variants={staggerChild}
              whileHover={{ y: -4, rotateX: 1.2, rotateY: -1.2 }}
              transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              style={{ transformPerspective: 1200 }}
              className="surface-panel relative overflow-hidden p-6"
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -right-14 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.2),rgba(96,165,250,0))] blur-2xl dark:bg-[radial-gradient(circle,rgba(223,190,130,0.18),rgba(223,190,130,0))]"
                animate={{ x: [0, 10, 0], y: [0, 8, 0], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
              />
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
                <motion.div
                  whileHover={{ y: -6, rotateY: -5, rotateX: 3 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  style={{ transformPerspective: 1300 }}
                  className="tech-card p-4"
                >
                  <div className="group relative overflow-hidden rounded-xl">
                    <BookCornerRibbon className="h-20 w-20" />
                    <BookCover
                      src={popularBooks?.[0]?.coverImage}
                      alt={popularBooks?.[0]?.title || 'Best seller'}
                      className="aspect-[2/3] w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.32),transparent)]"
                      animate={{ x: ['-120%', '230%'] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
                    />
                  </div>
                </motion.div>
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
              whileHover={{ y: -4, rotateX: 1.1, rotateY: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              style={{ transformPerspective: 1200 }}
              className="surface-panel relative overflow-hidden p-6"
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18),rgba(20,184,166,0))] blur-2xl dark:bg-[radial-gradient(circle,rgba(56,189,248,0.16),rgba(56,189,248,0))]"
                animate={{ x: [0, -8, 0], y: [0, 10, 0], opacity: [0.6, 0.95, 0.6] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
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
                {(recommendedBooks || []).slice(0, 4).map((book, idx) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.28, delay: idx * 0.05 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="tech-card group flex gap-3 p-3"
                  >
                    <BookCover
                      src={book.coverImage}
                      alt={book.title}
                      className="h-20 w-14 rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.04]"
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
                  </motion.div>
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
                      className="relative mx-auto h-28 w-[220px]"
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
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span />
                      <Link to="/library?filter=TO_READ" className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                        Open queue{queuedOverflowCount > 0 ? ` (+${queuedOverflowCount})` : ''}
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
