import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  ChevronDown,
  Check,
  Eye,
  Heart,
  ListPlus,
  Lock,
  Plus,
  Trash2,
  Share2,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react'
import { useBook, useBooks } from '@/services/books'
import { useBookReviews } from '@/services/reviews'
import ReviewForm from '@/components/books/ReviewForm'
import ReviewsList from '@/components/books/ReviewsList'
import BookCover from '@/components/ui/BookCover'
import BookCornerRibbon from '@/components/ui/BookCornerRibbon'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { isBestSellerBook } from '@/lib/books'
import { useAuthStore } from '@/store/auth.store'
import {
  useAddToFavorites,
  useFavorites,
  useRemoveFromFavorites,
} from '@/services/library'
import {
  type ReadingStatus,
  useReadingItems,
  useRemoveTrackedBook,
  useTrackBook,
  useUpdateReadingGoal,
  useUpdateReadingProgress,
  useUpdateReadingStatus,
} from '@/services/reading'
import { getErrorMessage } from '@/lib/api'
import { useAddToCart } from '@/services/cart'
import { useFilterStore } from '@/store/filter.store'
import {
  createLibraryList,
  getLibraryLists,
  getListsForBook,
  toggleBookInLibraryList,
} from '@/lib/libraryLists'

const STATUS_OPTIONS: Array<{
  label: string
  value: ReadingStatus
  description: string
  icon: typeof BookOpen
}> = [
  { label: 'Want to Read', value: 'TO_READ', description: 'Save for later', icon: BookOpen },
  { label: 'Currently Reading', value: 'READING', description: 'Track progress', icon: Eye },
  { label: 'Finished', value: 'FINISHED', description: 'Mark complete and rate', icon: Check },
]

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const applyPresetFilters = useFilterStore((state) => state.applyPresetFilters)
  const reviewsRef = useRef<HTMLDivElement | null>(null)

  const { isAuthenticated } = useAuthStore()
  const { data: book, isLoading } = useBook(id!)
  const { data: reviews = [] } = useBookReviews(id!)
  const { data: favorites = [] } = useFavorites(isAuthenticated)
  const { data: trackedItems = [] } = useReadingItems({
    bookId: id,
    enabled: isAuthenticated && Boolean(id),
  })

  const addToFavorites = useAddToFavorites()
  const removeFromFavorites = useRemoveFromFavorites()
  const trackBook = useTrackBook()
  const updateReadingStatus = useUpdateReadingStatus()
  const updateReadingProgress = useUpdateReadingProgress()
  const updateReadingGoal = useUpdateReadingGoal()
  const removeTrackedBook = useRemoveTrackedBook()
  const addToCart = useAddToCart()

  const [optionsOpen, setOptionsOpen] = useState(false)
  const [libraryMessage, setLibraryMessage] = useState('')
  const [quickAdded, setQuickAdded] = useState(false)
  const [owned, setOwned] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)
  const [libraryLists, setLibraryLists] = useState<string[]>([])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [newListName, setNewListName] = useState('')
  const [progressDraft, setProgressDraft] = useState({ currentPage: 0, totalPages: 0, dailyGoalPages: 0 })
  const [localFavorited, setLocalFavorited] = useState(false)
  const [shareToast, setShareToast] = useState('')
  const [cartMessage, setCartMessage] = useState('')

  const trackedItem = trackedItems[0]
  const isTracked = Boolean(trackedItem)
  const isFavorite = localFavorited || favorites.some((item) => item.bookId === book?.id)
  const selectedStatus = trackedItem?.status ?? 'TO_READ'

  useEffect(() => {
    if (!book) return
    setLocalFavorited(favorites.some((item) => item.bookId === book.id))
  }, [book, favorites])

  useEffect(() => {
    if (!libraryMessage) return
    const timeout = window.setTimeout(() => setLibraryMessage(''), 2400)
    return () => window.clearTimeout(timeout)
  }, [libraryMessage])

  useEffect(() => {
    if (!cartMessage) return
    const timeout = window.setTimeout(() => setCartMessage(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [cartMessage])

  useEffect(() => {
    if (!trackedItem) return
    setProgressDraft({
      currentPage: trackedItem.currentPage ?? 0,
      totalPages: trackedItem.totalPages ?? 0,
      dailyGoalPages: trackedItem.dailyGoalPages ?? 0,
    })
  }, [trackedItem])

  useEffect(() => {
    const allLists = getLibraryLists().map((item) => item.name)
    setLibraryLists(allLists)
  }, [])

  useEffect(() => {
    if (!book) return
    setSelectedLists(getListsForBook(book.id))
  }, [book])

  const genreTags = useMemo(() => {
    const tags = new Set<string>()
    ;(book?.categories ?? []).forEach((item) => {
      if (item.trim()) tags.add(item)
    })
    ;(book?.genres ?? []).forEach((item) => {
      if (item.trim()) tags.add(item)
    })
    return Array.from(tags).slice(0, 6)
  }, [book])

  const primaryGenre = genreTags[0]
  const { data: authorBooks } = useBooks(
    { author: book?.author, limit: 8 },
    { enabled: Boolean(book?.author) }
  )
  const { data: genreBooks } = useBooks(
    { genre: primaryGenre, limit: 8 },
    { enabled: Boolean(primaryGenre) }
  )

  const authorRecommendations = useMemo(() => {
    if (!book) return []
    return (authorBooks?.books ?? []).filter((item) => item.id !== book.id).slice(0, 6)
  }, [authorBooks?.books, book])

  const genreRecommendations = useMemo(() => {
    if (!book) return []
    return (genreBooks?.books ?? []).filter((item) => item.id !== book.id).slice(0, 6)
  }, [genreBooks?.books, book])

  const ratingSummary = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const review of reviews) {
      const bucket = Math.min(5, Math.max(1, Math.round(review.rating)))
      counts[bucket] += 1
    }

    const total = reviews.length
    const average = total > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
      : (book?.rating ?? 0)

    return {
      total,
      average,
      counts,
    }
  }, [book?.rating, reviews])

  const ensureAuth = () => {
    if (isAuthenticated) return true
    navigate('/login')
    return false
  }

  const handleToggleFavorite = async () => {
    if (!book || !ensureAuth()) return
    const current = isFavorite
    setLocalFavorited(!current)

    try {
      if (current) {
        await removeFromFavorites.mutateAsync({ bookId: book.id })
        setLibraryMessage('Removed from favorites.')
      } else {
        await addToFavorites.mutateAsync({ bookId: book.id, book })
        setLibraryMessage('Added to favorites.')
      }
    } catch (error) {
      setLocalFavorited(current)
      setLibraryMessage(getErrorMessage(error))
    }
  }

  const handleShare = async () => {
    if (!book) return
    const shareUrl = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: book.title,
          text: `Check out "${book.title}" by ${book.author}`,
          url: shareUrl,
        })
        setShareToast('Shared successfully.')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        setShareToast('Link copied to clipboard.')
      } else {
        setShareToast('Copy URL from address bar to share.')
      }
    } catch {
      setShareToast('Unable to share right now.')
    } finally {
      window.setTimeout(() => setShareToast(''), 2200)
    }
  }

  const handleAddToLibrary = async () => {
    if (!book || !ensureAuth()) return
    try {
      if (!isTracked) {
        await trackBook.mutateAsync({ bookId: book.id, status: 'TO_READ' })
        setQuickAdded(true)
        setLibraryMessage('Added to Want to Read.')
        setOptionsOpen(false)
        return
      }
      setQuickAdded(false)
      setOptionsOpen((prev) => !prev)
    } catch (error) {
      setLibraryMessage(getErrorMessage(error))
    }
  }

  const handleAddToCart = async () => {
    if (!book || !ensureAuth()) return
    if (book.stock <= 0) {
      setCartMessage('This book is out of stock.')
      return
    }
    try {
      await addToCart.mutateAsync({ bookId: book.id, quantity: 1 })
      setCartMessage('Added to cart.')
    } catch (error) {
      setCartMessage(getErrorMessage(error))
    }
  }

  const handleStatusChange = async (status: ReadingStatus) => {
    if (!book || !ensureAuth()) return
    try {
      if (isTracked) {
        await updateReadingStatus.mutateAsync({ bookId: book.id, status })
      } else {
        await trackBook.mutateAsync({ bookId: book.id, status })
      }
      setLibraryMessage(`Moved to ${STATUS_OPTIONS.find((item) => item.value === status)?.label}.`)
    } catch (error) {
      setLibraryMessage(getErrorMessage(error))
    }
  }

  const handleRemoveFromLibrary = async () => {
    if (!book || !isTracked || !ensureAuth()) return
    try {
      await removeTrackedBook.mutateAsync(book.id)
      setLibraryMessage('Removed from Library.')
      setOptionsOpen(false)
    } catch (error) {
      setLibraryMessage(getErrorMessage(error))
    }
  }

  const handleSaveReadingProgress = async () => {
    if (!book || !isTracked || !ensureAuth()) return
    try {
      await updateReadingProgress.mutateAsync({
        bookId: book.id,
        currentPage: Math.max(0, progressDraft.currentPage || 0),
        totalPages: progressDraft.totalPages > 0 ? progressDraft.totalPages : undefined,
      })
      await updateReadingGoal.mutateAsync({
        bookId: book.id,
        dailyGoalPages: progressDraft.dailyGoalPages > 0 ? progressDraft.dailyGoalPages : undefined,
      })
      setLibraryMessage('Progress and daily goal updated.')
    } catch (error) {
      setLibraryMessage(getErrorMessage(error))
    }
  }

  const toggleCustomList = (list: string) => {
    if (!book) return
    const updatedLists = toggleBookInLibraryList(book.id, list)
    setLibraryLists(updatedLists.map((item) => item.name))
    setSelectedLists(getListsForBook(book.id))
  }

  const handleCreateList = () => {
    if (!book) return
    const next = newListName.trim()
    if (!next) return
    const updated = createLibraryList(next)
    setLibraryLists(updated.map((item) => item.name))
    const existsInBook = getListsForBook(book.id).includes(next)
    if (!existsInBook) {
      const withBook = toggleBookInLibraryList(book.id, next)
      setLibraryLists(withBook.map((item) => item.name))
    }
    setSelectedLists(getListsForBook(book.id))
    setNewListName('')
  }

  const handleAuthorQuickSearch = (author: string) => {
    applyPresetFilters({
      title: '',
      author,
      category: '',
      genre: '',
      minPrice: null,
      maxPrice: null,
      minRating: null,
      inStockOnly: false,
    })
    navigate('/books')
  }

  const handleTagQuickSearch = (tag: string) => {
    const isCategoryTag = (book?.categories ?? []).some(
      (category) => category.toLowerCase() === tag.toLowerCase(),
    )
    applyPresetFilters({
      title: '',
      author: '',
      category: isCategoryTag ? tag : '',
      genre: isCategoryTag ? '' : tag,
      minPrice: null,
      maxPrice: null,
      minRating: null,
      inStockOnly: false,
    })
    navigate('/books')
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)]">
          <Skeleton className="aspect-[2/3] rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-56 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Book not found</h2>
        <Link to="/books" className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-white/20 dark:text-slate-200">
          Browse books
        </Link>
      </div>
    )
  }

  const totalRatings = ratingSummary.total
  const averageRating = Number.isFinite(ratingSummary.average) ? ratingSummary.average : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0f1114] dark:text-slate-100"
    >
      <div className="relative overflow-hidden">
        {book.coverImage && (
          <div
            className="pointer-events-none absolute inset-0 opacity-15 dark:opacity-45"
            style={{
              backgroundImage: `url(${book.coverImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'blur(80px)',
              transform: 'scale(1.2)',
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/85 via-slate-100/80 to-slate-100 dark:from-[#0b111b]/85 dark:via-[#171017]/80 dark:to-[#0c0e12]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <nav className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/75">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white">Home</Link>
            <span className="mx-2 text-slate-400 dark:text-slate-500">/</span>
            <Link to="/books" className="hover:text-slate-900 dark:hover:text-white">Bookstore</Link>
            <span className="mx-2 text-slate-400 dark:text-slate-500">/</span>
            <span className="text-slate-900 dark:text-slate-100">{book.title}</span>
          </nav>

          {libraryMessage && (
            <div className="mb-4 rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{libraryMessage}</span>
                {quickAdded && (
                  <button
                    type="button"
                    onClick={() => {
                      setOptionsOpen(true)
                      setQuickAdded(false)
                    }}
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700/90 hover:text-emerald-800 dark:text-emerald-100/90 dark:hover:text-white"
                  >
                    Change status
                  </button>
                )}
              </div>
            </div>
          )}
          {shareToast && (
            <div className="mb-4 rounded-xl border border-sky-300/60 bg-sky-50 px-4 py-2 text-sm text-sky-700 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-100">
              {shareToast}
            </div>
          )}

          <section className="rounded-[2rem] border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 lg:p-8">
            <div className="grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="mx-auto w-full max-w-[320px] rounded-2xl bg-gradient-to-br from-white/60 to-white/40 p-3 shadow-lg backdrop-blur-sm dark:from-slate-800/40 dark:to-slate-900/40">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-md">
                  {isBestSellerBook(book) && <BookCornerRibbon />}
                  <BookCover src={book.coverImage} alt={book.title} className="h-full w-full" />
                </div>
              </div>

              <div>
                <h1 className="font-library-display text-5xl leading-tight text-slate-900 dark:text-[#f7f5f0]">{book.title}</h1>
                <button
                  type="button"
                  onClick={() => handleAuthorQuickSearch(book.author)}
                  className="mt-2 text-3xl text-slate-600 transition hover:text-primary-600 dark:text-slate-300 dark:hover:text-amber-300"
                >
                  {book.author}
                </button>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-800/60">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500 dark:fill-amber-300 dark:text-amber-300" />
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">{averageRating.toFixed(2)}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-300">({totalRatings.toLocaleString()} ratings)</span>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-sm',
                      book.stock <= 0
                        ? 'border border-rose-200/50 bg-rose-50/80 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-200'
                        : book.stock <= 5
                          ? 'border border-amber-200/50 bg-amber-50/80 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200'
                          : 'border border-emerald-200/50 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200'
                    )}
                  >
                    {book.stock <= 0 ? 'Out of stock' : book.stock <= 5 ? `Only ${book.stock} left` : 'In stock'}
                  </span>
                </div>

                {genreTags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {genreTags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleTagQuickSearch(tag)}
                        className="rounded-full border border-slate-200/50 bg-slate-100/70 px-4 py-1 text-sm font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-slate-200/80 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleAddToCart()}
                    disabled={book.stock <= 0 || addToCart.isPending}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition',
                      book.stock <= 0
                        ? 'border border-slate-200/50 bg-slate-100/70 text-slate-400 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-500'
                        : 'border border-white/30 bg-white/70 text-slate-700 shadow-md backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
                    )}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAddToLibrary()}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] backdrop-blur-sm transition',
                      isTracked
                        ? 'border border-emerald-200/50 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-100'
                        : 'border border-white/30 bg-white/70 text-slate-700 shadow-md hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
                    )}
                    disabled={trackBook.isPending || updateReadingStatus.isPending}
                  >
                    {isTracked ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {isTracked ? 'In Library' : 'Add to Library'}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleToggleFavorite()}
                    className={cn(
                      'inline-flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-sm transition',
                      isFavorite
                        ? 'border border-rose-200/50 bg-rose-50/80 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-200'
                        : 'border border-white/30 bg-white/70 text-slate-700 shadow-md hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
                    )}
                    aria-label="Favorite"
                  >
                    <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
                  </button>

                  {isTracked && (
                    <button
                      type="button"
                      onClick={() => void handleShare()}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white"
                      aria-label="Share"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {cartMessage && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{cartMessage}</p>
                )}

                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-700 dark:text-slate-200/90">
                  {book.description || 'No description available yet.'}
                </p>
              </div>
            </div>
          </section>

          {(authorRecommendations.length > 0 || genreRecommendations.length > 0) && (
            <section className="mt-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Recommended</p>
                  <h2 className="mt-2 font-library-display text-2xl text-slate-900 dark:text-white">
                    More like this
                  </h2>
                </div>
                <Link to="/books" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                  Explore all
                </Link>
              </div>

              <div
                className={cn(
                  'grid gap-8',
                  authorRecommendations.length > 0 && genreRecommendations.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
                )}
              >
                {authorRecommendations.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleAuthorQuickSearch(book.author)}
                        className="text-sm font-semibold text-slate-800 hover:text-primary-600 dark:text-slate-200 dark:hover:text-amber-300"
                      >
                        More by {book.author}
                      </button>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Same author</span>
                    </div>
                    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                      {authorRecommendations.map((item) => (
                        <Link
                          key={item.id}
                          to={`/books/${item.id}`}
                          className="group w-32 shrink-0 transition hover:-translate-y-1"
                        >
                          <BookCover src={item.coverImage} alt={item.title} className="aspect-[2/3] w-full rounded-xl object-cover shadow-md" />
                          <p className="mt-2 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {genreRecommendations.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => primaryGenre && handleTagQuickSearch(primaryGenre)}
                        className="text-sm font-semibold text-slate-800 hover:text-primary-600 dark:text-slate-200 dark:hover:text-amber-300"
                      >
                        Similar genre
                      </button>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{primaryGenre || 'Genre'}</span>
                    </div>
                    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                      {genreRecommendations.map((item) => (
                        <Link
                          key={item.id}
                          to={`/books/${item.id}`}
                          className="group w-32 shrink-0 transition hover:-translate-y-1"
                        >
                          <BookCover src={item.coverImage} alt={item.title} className="aspect-[2/3] w-full rounded-xl object-cover shadow-md" />
                          <p className="mt-2 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section ref={reviewsRef} className="mt-10 rounded-3xl border border-white/20 bg-white/40 p-8 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40">
            <div className="grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
              <section className="xl:border-r xl:border-slate-200/30 xl:pr-8 dark:xl:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Rating Summary</p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-5xl font-black text-slate-900 dark:text-white">{averageRating.toFixed(2)}</p>
                <p className="pb-2 text-sm text-slate-500 dark:text-slate-300">{totalRatings.toLocaleString()} ratings</p>
              </div>

              <div className="mt-4 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingSummary.counts[rating]
                  const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
                  return (
                    <div key={rating} className="grid grid-cols-[56px_minmax(0,1fr)_48px] items-center gap-2 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{rating}★</span>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200/60 backdrop-blur-sm dark:bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-300" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-right text-slate-500 dark:text-slate-400">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
              </section>

              <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Write a Review</p>
              <div className="mt-4">
                <ReviewForm bookId={book.id} />
              </div>
              </section>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-white/20 bg-white/40 p-8 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reader Reviews</p>
            <div>
              <ReviewsList bookId={book.id} />
            </div>
          </section>
        </div>
      </div>
      <div className="pointer-events-none h-20 bg-gradient-to-b from-transparent to-[#0f1726]/45 dark:to-[#0f1726]/65" />

      {optionsOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm dark:bg-black/80"
            onClick={() => setOptionsOpen(false)}
            aria-label="Close options"
          />
          <section className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="pointer-events-auto w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-white/95 p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/15 dark:bg-[#141418]/96 dark:text-slate-100">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-12 overflow-hidden rounded-lg border border-slate-300 dark:border-white/20">
                  <BookCover src={book.coverImage} alt={book.title} className="h-full w-full" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Library Options</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{book.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOptionsOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-300/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Reading Status</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => void handleStatusChange(option.value)}
                      whileTap={{ scale: 0.98 }}
                      animate={selectedStatus === option.value ? { scale: 1.01 } : { scale: 1 }}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-left transition',
                        selectedStatus === option.value
                          ? 'border-emerald-300/70 bg-emerald-50 text-emerald-700 shadow-[0_0_0_1px_rgba(16,185,129,0.15)] dark:border-emerald-300/45 dark:bg-emerald-500/12 dark:text-emerald-100'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30'
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {selectedStatus === 'READING' && (
              <div className="mt-4 rounded-2xl border border-slate-300/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Reading Progress</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Current page
                    <input
                      type="number"
                      min={0}
                      value={progressDraft.currentPage}
                      onChange={(e) => setProgressDraft((prev) => ({ ...prev, currentPage: Number(e.target.value) || 0 }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-white/[0.02] dark:text-white"
                    />
                  </label>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Total pages
                    <input
                      type="number"
                      min={0}
                      value={progressDraft.totalPages}
                      onChange={(e) => setProgressDraft((prev) => ({ ...prev, totalPages: Number(e.target.value) || 0 }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-white/[0.02] dark:text-white"
                    />
                  </label>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Daily goal
                    <input
                      type="number"
                      min={0}
                      value={progressDraft.dailyGoalPages}
                      onChange={(e) => setProgressDraft((prev) => ({ ...prev, dailyGoalPages: Number(e.target.value) || 0 }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-white/[0.02] dark:text-white"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveReadingProgress()}
                  className="mt-3 rounded-xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:border-emerald-400 dark:border-emerald-300/35 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:border-emerald-200/50"
                >
                  Save progress
                </button>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-300/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Personalization</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleFavorite()}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition',
                      isFavorite
                        ? 'border-rose-300/70 bg-rose-50 text-rose-600 dark:border-rose-300/40 dark:bg-rose-500/10 dark:text-rose-200'
                        : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30'
                    )}
                  >
                    <Heart className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
                    Favorite
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwned((prev) => !prev)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition',
                      owned
                        ? 'border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-300/40 dark:bg-amber-500/10 dark:text-amber-100'
                        : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30'
                    )}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Owned
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate((prev) => !prev)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition',
                      isPrivate
                        ? 'border-sky-300/70 bg-sky-50 text-sky-700 dark:border-sky-300/40 dark:bg-sky-500/10 dark:text-sky-100'
                        : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30'
                    )}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Private
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-300/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Lists</p>
                <button
                  type="button"
                  onClick={() => setListsOpen((prev) => !prev)}
                  className="mt-2 inline-flex w-full items-center justify-between rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30"
                >
                  <span className="inline-flex items-center gap-2">
                    <ListPlus className="h-4 w-4" />
                    {selectedLists.length > 0 ? `${selectedLists.length} list(s) selected` : 'Add to list'}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition', listsOpen && 'rotate-180')} />
                </button>
                {listsOpen && (
                  <div className="mt-2 space-y-2">
                    {libraryLists.map((list) => (
                      <label key={list} className="flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={selectedLists.includes(list)}
                          onChange={() => toggleCustomList(list)}
                        />
                        <span>{list}</span>
                      </label>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Create new list"
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/15 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateList}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              {isTracked && (
                <button
                  type="button"
                  onClick={() => void handleRemoveFromLibrary()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-300/70 bg-rose-50 text-rose-600 transition hover:border-rose-400 dark:border-rose-300/35 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:border-rose-200/60"
                  aria-label="Remove from library"
                  title="Remove from library"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
            </div>
          </section>
        </>
      )}
    </motion.div>
  )
}

export default BookDetailPage
