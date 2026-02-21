import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  BookOpenCheck,
  Check,
  ListFilter,
  ListChecks,
  ListPlus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useFavorites, useWishlist } from '@/services/library'
import {
  type ReadingStatus,
  useCreateReadingSession,
  useReadingItems,
  useRemoveTrackedBook,
  useTrackBook,
  useUpdateReadingGoal,
  useUpdateReadingProgress,
  useUpdateReadingStatus,
} from '@/services/reading'
import BookCover from '@/components/ui/BookCover'
import Skeleton from '@/components/ui/Skeleton'
import { getErrorMessage } from '@/lib/api'
import { getLibraryLists, type LibraryList } from '@/lib/libraryLists'
import { cn } from '@/lib/utils'

type LibraryStatusFilter = 'ALL' | 'TO_READ' | 'READING' | 'FINISHED'
type ActiveLibraryFilter =
  | { type: 'status'; value: LibraryStatusFilter }
  | { type: 'list'; value: string }

type LibraryItem = {
  id: string
  bookId: string
  book?: {
    title?: string
    author?: string
    coverImage?: string | null
  }
}

const isLibraryStatusFilter = (value: string): value is LibraryStatusFilter =>
  value === 'ALL' || value === 'TO_READ' || value === 'READING' || value === 'FINISHED'

const STATUS_LABEL: Record<ReadingStatus, string> = {
  TO_READ: 'Want to Read',
  READING: 'Currently Reading',
  FINISHED: 'Finished',
}

const FILTER_META: Record<LibraryStatusFilter, { label: string; icon: React.ReactNode }> = {
  ALL: { label: 'All', icon: <BookOpen className="h-4 w-4" /> },
  TO_READ: { label: 'Want to Read', icon: <ListChecks className="h-4 w-4" /> },
  READING: { label: 'Currently Reading', icon: <BookOpenCheck className="h-4 w-4" /> },
  FINISHED: { label: 'Finished', icon: <Check className="h-4 w-4" /> },
}

const LibraryPage = () => {
  const location = useLocation()
  const [activeFilter, setActiveFilter] = useState<ActiveLibraryFilter>({ type: 'status', value: 'ALL' })
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [isBookCardFlipped, setIsBookCardFlipped] = useState(false)
  const [customLists, setCustomLists] = useState<LibraryList[]>([])
  const [feedback, setFeedback] = useState('')
  const [currentPageInput, setCurrentPageInput] = useState('0')
  const [totalPagesInput, setTotalPagesInput] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const detailPanelRef = useRef<HTMLElement | null>(null)

  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites(true)
  const { data: wishlist = [], isLoading: wishlistLoading } = useWishlist(true)
  const { data: readingItems = [], isLoading: readingLoading } = useReadingItems()

  const trackBook = useTrackBook()
  const updateStatus = useUpdateReadingStatus()
  const updateProgress = useUpdateReadingProgress()
  const updateGoal = useUpdateReadingGoal()
  const createReadingSession = useCreateReadingSession()
  const removeTrackedBook = useRemoveTrackedBook()

  const allBooksById = useMemo(() => {
    const map = new Map<string, LibraryItem>()
    const register = (item: LibraryItem) => {
      const existing = map.get(item.bookId)
      if (!existing) {
        map.set(item.bookId, item)
        return
      }
      map.set(item.bookId, {
        ...existing,
        ...item,
        book: {
          ...existing.book,
          ...item.book,
        },
      })
    }

    favorites.forEach(register)
    wishlist.forEach(register)
    readingItems.forEach(register)
    return map
  }, [favorites, readingItems, wishlist])

  const allBooks = Array.from(allBooksById.values())
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const querySelectedBookId = queryParams.get('selectedBookId') || queryParams.get('bookId') || queryParams.get('book')
  const queryFilter = queryParams.get('filter')

  const filteredBooks = useMemo(() => {
    if (activeFilter.type === 'status') {
      if (activeFilter.value === 'ALL') return allBooks
      return readingItems.filter((item) => item.status === activeFilter.value)
    }
    const selectedList = customLists.find((list) => list.name === activeFilter.value)
    if (!selectedList) return []
    return allBooks.filter((item) => selectedList.bookIds.includes(item.bookId))
  }, [activeFilter, allBooks, customLists, readingItems])

  const recentActivity = useMemo(() => {
    return [...readingItems]
      .filter((item) => item.book?.title)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4)
  }, [readingItems])

  const counts = {
    ALL: allBooks.length,
    TO_READ: readingItems.filter((item) => item.status === 'TO_READ').length,
    READING: readingItems.filter((item) => item.status === 'READING').length,
    FINISHED: readingItems.filter((item) => item.status === 'FINISHED').length,
  }

  useEffect(() => {
    const refresh = () => setCustomLists(getLibraryLists())
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    if (!filteredBooks.length) {
      setSelectedBookId(null)
      setIsDetailPanelOpen(false)
      setIsBookCardFlipped(false)
      return
    }
    if (selectedBookId && !filteredBooks.some((item) => item.bookId === selectedBookId)) {
      setSelectedBookId(null)
      setIsDetailPanelOpen(false)
      setIsBookCardFlipped(false)
    }
  }, [filteredBooks, selectedBookId])

  const selectedPreview = selectedBookId ? allBooksById.get(selectedBookId) : undefined
  const selectedReadingItem = readingItems.find((item) => item.bookId === selectedBookId)
  const isLoading = favoritesLoading || wishlistLoading || readingLoading
  const isPendingAction =
    trackBook.isPending ||
    updateStatus.isPending ||
    updateProgress.isPending ||
    updateGoal.isPending ||
    createReadingSession.isPending ||
    removeTrackedBook.isPending

  useEffect(() => {
    if (!selectedReadingItem) {
      setCurrentPageInput('0')
      setTotalPagesInput('')
      setGoalInput('')
      return
    }
    setCurrentPageInput(String(selectedReadingItem.currentPage))
    setTotalPagesInput(selectedReadingItem.totalPages ? String(selectedReadingItem.totalPages) : '')
    setGoalInput(selectedReadingItem.dailyGoalPages ? String(selectedReadingItem.dailyGoalPages) : '')
  }, [selectedReadingItem])

  useEffect(() => {
    if (!isDetailPanelOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDetailPanelOpen])

  const showMessage = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2200)
  }

  const ensureTracked = async (bookId: string, status: ReadingStatus) => {
    const existing = readingItems.find((item) => item.bookId === bookId)
    if (existing) return existing
    return trackBook.mutateAsync({ bookId, status })
  }

  const handleStatusUpdate = async (status: ReadingStatus) => {
    if (!selectedBookId) return
    try {
      const existing = readingItems.find((item) => item.bookId === selectedBookId)
      if (existing) {
        await updateStatus.mutateAsync({ bookId: selectedBookId, status })
      } else {
        await trackBook.mutateAsync({ bookId: selectedBookId, status })
      }
      showMessage(`Moved to ${STATUS_LABEL[status]}.`)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleSaveDetails = async () => {
    if (!selectedBookId) return
    const currentPage = Number(currentPageInput)
    const totalPages = totalPagesInput.trim() ? Number(totalPagesInput) : undefined
    const dailyGoal = goalInput.trim() ? Number(goalInput) : undefined

    if (Number.isNaN(currentPage) || currentPage < 0) {
      showMessage('Current page must be a valid number.')
      return
    }
    if (totalPages !== undefined && (Number.isNaN(totalPages) || totalPages < 1)) {
      showMessage('Total pages must be a valid number greater than 0.')
      return
    }
    if (dailyGoal !== undefined && (Number.isNaN(dailyGoal) || dailyGoal < 1)) {
      showMessage('Daily goal must be at least 1.')
      return
    }

    try {
      const previousPage = selectedReadingItem?.currentPage ?? 0
      const pagesDelta = Math.max(0, currentPage - previousPage)
      await ensureTracked(selectedBookId, 'TO_READ')
      await updateProgress.mutateAsync({ bookId: selectedBookId, currentPage, totalPages })
      await updateGoal.mutateAsync({ bookId: selectedBookId, dailyGoalPages: dailyGoal })
      if (pagesDelta > 0) {
        await createReadingSession.mutateAsync({
          bookId: selectedBookId,
          pagesRead: pagesDelta,
          sessionDate: new Date().toISOString(),
          notes: 'Auto-logged from Library progress update',
        })
        showMessage(`Reading details saved. Logged ${pagesDelta} pages as a session.`)
        return
      }
      showMessage('Reading details saved.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleRemove = async () => {
    if (!selectedBookId) return
    try {
      await removeTrackedBook.mutateAsync(selectedBookId)
      showMessage('Removed from tracking.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const openDetailPanel = (bookId: string) => {
    setSelectedBookId(bookId)
    setIsDetailPanelOpen(true)
    setIsBookCardFlipped(false)
    setIsFilterPanelOpen(false)
  }

  const closeDetailPanel = () => {
    setIsDetailPanelOpen(false)
    setIsBookCardFlipped(false)
  }

  useEffect(() => {
    if (!queryFilter) return
    if (!isLibraryStatusFilter(queryFilter)) return
    setActiveFilter((prev) => {
      if (prev.type === 'status' && prev.value === queryFilter) return prev
      return { type: 'status', value: queryFilter }
    })
  }, [queryFilter])

  useEffect(() => {
    if (!querySelectedBookId || isLoading) return
    if (!allBooksById.has(querySelectedBookId)) return
    setSelectedBookId(querySelectedBookId)
    setIsDetailPanelOpen(true)
    setIsBookCardFlipped(false)
    setIsFilterPanelOpen(false)
  }, [allBooksById, isLoading, querySelectedBookId])

  const activeFilterLabel = activeFilter.type === 'status'
    ? FILTER_META[activeFilter.value].label
    : activeFilter.value

  const shelfRows = useMemo(() => {
    if (activeFilter.type === 'status' && activeFilter.value === 'ALL') {
      const reading = readingItems.filter((item) => item.status === 'READING')
      const toRead = readingItems.filter((item) => item.status === 'TO_READ')
      const finished = readingItems.filter((item) => item.status === 'FINISHED')
      return [
        { key: 'READING', title: 'Currently Reading', books: reading },
        { key: 'TO_READ', title: 'Next Up', books: toRead },
        { key: 'FINISHED', title: 'Finished', books: finished },
      ].filter((row) => row.books.length > 0)
    }

    return [
      {
        key: 'ACTIVE',
        title: activeFilterLabel,
        books: filteredBooks,
      },
    ]
  }, [activeFilter, activeFilterLabel, filteredBooks, readingItems])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#101012] dark:text-[#f5f5f1]">
      <div className="pointer-events-none fixed inset-0 hidden opacity-80 dark:block">
        <div className="absolute -left-24 top-14 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(255,194,97,0.12),_rgba(0,0,0,0))]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(91,59,182,0.2),_rgba(0,0,0,0))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Reading Workspace</p>
            <h1 className="mt-2 font-library-display text-4xl text-slate-900 dark:text-[#f5f5f1]">Library</h1>
          </div>
          <Link
            to="/books"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
            aria-label="Browse books"
          >
            <Search className="h-5 w-5" />
          </Link>
        </header>

        {feedback && (
          <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            {feedback}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#17171a]/85 lg:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{activeFilterLabel}</h2>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{filteredBooks.length} books</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-white/30 dark:hover:text-white"
            >
              <ListFilter className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div
            className={cn(
              'origin-top overflow-hidden transition-[max-height,opacity,transform,margin] duration-400 ease-out will-change-[max-height,opacity,transform]',
              isFilterPanelOpen
                ? 'mb-6 max-h-[560px] translate-y-0 opacity-100'
                : 'mb-0 max-h-0 -translate-y-1 opacity-0 pointer-events-none'
            )}
          >
            <div
              className={cn(
                'rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-transform duration-400 ease-out dark:border-white/10 dark:bg-white/[0.03]',
                isFilterPanelOpen ? 'translate-y-0' : '-translate-y-2'
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Filter library</p>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                  aria-label="Close filters"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">By status</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FILTER_META) as LibraryStatusFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter({ type: 'status', value: filter })}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition',
                        activeFilter.type === 'status' && activeFilter.value === filter
                          ? 'border-slate-300 bg-white text-slate-900 dark:border-white/35 dark:bg-white/[0.12] dark:text-white'
                          : 'border-slate-300/80 text-slate-600 hover:border-slate-400 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30'
                      )}
                    >
                      {FILTER_META[filter].icon}
                      {FILTER_META[filter].label}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-white/10">{counts[filter]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">By your lists</p>
                <div className="flex flex-wrap gap-2">
                  {customLists.map((list) => {
                    const listCount = allBooks.filter((item) => list.bookIds.includes(item.bookId)).length
                    return (
                      <button
                        key={list.name}
                        type="button"
                        onClick={() => setActiveFilter({ type: 'list', value: list.name })}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition',
                          activeFilter.type === 'list' && activeFilter.value === list.name
                            ? 'border-slate-300 bg-white text-slate-900 dark:border-white/35 dark:bg-white/[0.12] dark:text-white'
                            : 'border-slate-300/80 text-slate-600 hover:border-slate-400 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30'
                        )}
                      >
                        <ListPlus className="h-3.5 w-3.5" />
                        {list.name}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-white/10">{listCount}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`lib-skeleton-${index}`} className="aspect-[2/3] rounded-2xl bg-slate-200 dark:bg-white/10" />
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-white/15 dark:bg-black/20 dark:text-slate-400">
              No books in this section yet.
            </div>
          ) : (
            <>
              <div
                className="space-y-10 rounded-2xl border border-[#e6ddd0] bg-gradient-to-b from-[#faf8f3] via-[#f6f2ea] to-[#f1ece2] p-4 transition-colors dark:border-[#3d352c] dark:from-[#1c1813] dark:via-[#1f1b16] dark:to-[#191612]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.45), transparent 42%), radial-gradient(circle at 82% 10%, rgba(255,255,255,0.24), transparent 40%), linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0))',
                }}
              >
                {shelfRows.map((row) => (
                  <div key={row.key} className="transition-all duration-500 ease-out">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{row.title}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{row.books.length} books</p>
                    </div>
                    <div className="relative">
                      <div className="no-scrollbar mx-4 overflow-x-auto pb-8">
                        <div className="inline-flex min-w-full items-end gap-6 px-2 pt-2">
                          {row.books.map((item) => {
                            return (
                              <button
                                key={`${row.key}-${item.id}`}
                                type="button"
                                onClick={() => openDetailPanel(item.bookId)}
                                className="group relative z-10 w-[118px] shrink-0 text-left sm:w-[128px]"
                              >
                                <div
                                  className={cn(
                                    'overflow-visible rounded-[2px] shadow-[0_6px_14px_rgba(15,23,42,0.14)] transition group-hover:-translate-y-1.5 group-hover:shadow-[0_14px_22px_rgba(15,23,42,0.2)]',
                                    selectedBookId === item.bookId && 'ring-2 ring-slate-300 dark:ring-white/40'
                                  )}
                                >
                                  <BookCover
                                    src={item.book?.coverImage ?? null}
                                    alt={item.book?.title || 'Book cover'}
                                    className="aspect-[2/3] w-full"
                                    variant="physical"
                                  />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div
                        className="pointer-events-none absolute bottom-3 left-4 right-4 h-4 rounded-[3px] border border-[#c8a075] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_18px_rgba(86,57,29,0.28)] dark:border-[#5d4734]"
                        style={{
                          backgroundImage:
                            'linear-gradient(180deg, #d7a66f 0%, #bd8753 35%, #8f5d32 100%), repeating-linear-gradient(90deg, rgba(74,45,24,0.25) 0, rgba(74,45,24,0.25) 1px, rgba(255,255,255,0.07) 1px, rgba(255,255,255,0.07) 12px)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {recentActivity.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Recent activity
                    </p>
                    <Link
                      to="/reading-insights"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      Open insights
                    </Link>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {recentActivity.map((item) => (
                      <button
                        key={`recent-${item.id}`}
                        type="button"
                        onClick={() => openDetailPanel(item.bookId)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25"
                      >
                        <div className="h-12 w-8 overflow-hidden rounded-md border border-slate-200 dark:border-white/10">
                          <BookCover src={item.book?.coverImage ?? null} alt={item.book?.title || 'Recent book'} className="h-full w-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                            {item.book?.title || 'Untitled'}
                          </p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            Updated {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <>
          <div
            onClick={closeDetailPanel}
            className={cn(
              'fixed inset-0 z-[60] bg-slate-900/35 backdrop-blur-[1px] transition-opacity dark:bg-black/45',
              isDetailPanelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            )}
          />

          <aside
            ref={detailPanelRef}
            className={cn(
              'fixed inset-y-0 right-0 z-[70] h-screen w-full max-w-[460px] overflow-hidden border-l border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-[#141418]/95',
              isDetailPanelOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reading Desk</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-[#f5f5f1]">Selected Book</h2>
              </div>
              <button
                type="button"
                onClick={closeDetailPanel}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                aria-label="Close selected book panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedPreview ? (
              <div className="no-scrollbar mt-5 h-[calc(100%-5rem)] overflow-y-auto pr-1">
                <div className="relative [perspective:1000px]">
                  <div
                    className={cn(
                      'relative min-h-[520px] transition-transform duration-500 [transform-style:preserve-3d]',
                      isBookCardFlipped ? '[transform:rotateY(180deg)]' : ''
                    )}
                  >
                    <div className="absolute inset-0 [backface-visibility:hidden]">
                      <button
                        type="button"
                        onClick={() => setIsBookCardFlipped(true)}
                        className="group w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25"
                      >
                        <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-white/15">
                          <BookCover
                            src={selectedPreview.book?.coverImage ?? null}
                            alt={selectedPreview.book?.title || 'Selected book'}
                            className="aspect-[2/3] w-full"
                          />
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-[#f5f5f1]">{selectedPreview.book?.title || 'Untitled'}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{selectedPreview.book?.author || 'Unknown author'}</p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition group-hover:border-slate-400 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:group-hover:border-white/30">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Flip to update progress
                        </div>
                      </button>
                    </div>

                    <div className="absolute inset-0 rounded-3xl border border-slate-200 bg-slate-50 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Reading details</p>
                        <button
                          type="button"
                          onClick={() => setIsBookCardFlipped(false)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Cover
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          <span>Progress</span>
                          <span>{selectedReadingItem?.progressPercent ?? 0}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300"
                            style={{ width: `${selectedReadingItem?.progressPercent ?? 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Status</p>
                        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-300 dark:border-white/15">
                          {(Object.keys(STATUS_LABEL) as ReadingStatus[]).map((status) => (
                            <button
                              key={`status-${status}`}
                              type="button"
                              disabled={isPendingAction}
                              onClick={() => void handleStatusUpdate(status)}
                              className={cn(
                                'px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60',
                                selectedReadingItem?.status === status
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                  : 'border-l border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                              )}
                            >
                              {status === 'TO_READ' ? 'Want' : status === 'READING' ? 'Reading' : 'Done'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                          Current page
                          <input
                            type="number"
                            min={0}
                            value={currentPageInput}
                            onChange={(event) => setCurrentPageInput(event.target.value)}
                            placeholder="e.g. 42"
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/15 dark:bg-black/30 dark:text-white dark:focus:border-white/40"
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                          Total pages
                          <input
                            type="number"
                            min={1}
                            value={totalPagesInput}
                            onChange={(event) => setTotalPagesInput(event.target.value)}
                            placeholder="e.g. 320"
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/15 dark:bg-black/30 dark:text-white dark:focus:border-white/40"
                          />
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Progress is calculated from current page and total pages.
                        </p>
                        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          Daily goal
                          <input
                            type="number"
                            min={1}
                            value={goalInput}
                            onChange={(event) => setGoalInput(event.target.value)}
                            placeholder="e.g. 20 pages/day"
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/15 dark:bg-black/30 dark:text-white dark:focus:border-white/40"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={isPendingAction}
                          onClick={() => void handleSaveDetails()}
                          className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                          Save Reading Details
                        </button>
                      </div>

                      {selectedReadingItem && (
                        <div className="mt-16 mx-auto rounded-xl border border-rose-300/35 bg-rose-50/50 p-3 dark:border-rose-300/20 dark:bg-rose-500/5">
                          <button
                            type="button"
                            disabled={isPendingAction}
                            onClick={() => void handleRemove()}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:text-rose-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove from tracking
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Select a book from your library to open the reading desk.</p>
            )}
          </aside>
        </>,
        document.body
      )}
    </div>
  )
}

export default LibraryPage
