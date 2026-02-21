import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useBooks } from '@/services/books'
import { useFilterStore } from '@/store/filter.store'
import BookCard from '@/components/books/BookCard'
import FilterSidebar from '@/components/books/FilterSidebar'
import BookCover from '@/components/ui/BookCover'
import BookCornerRibbon from '@/components/ui/BookCornerRibbon'
import PromoTicker from '@/components/ui/PromoTicker'
import PromoShowcase from '@/components/ui/PromoShowcase'
import { cn } from '@/lib/utils'
import { isBestSellerBook } from '@/lib/books'

const BooksPage = () => {
  const {
    page,
    limit,
    appliedFilters,
    setTitle,
    setAuthor,
    setCategory,
    setGenre,
    setPriceRange,
    setMinRating,
    setInStockOnly,
    setPage,
    applyPresetFilters,
    toggleMobileSidebar,
    resetFilters
  } = useFilterStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Construct search params for the API using appliedFilters
  const searchParams = {
    page: appliedFilters.page,
    limit: appliedFilters.limit,
    title: appliedFilters.title,
    author: appliedFilters.author,
    category: appliedFilters.category,
    genre: appliedFilters.genre,
    minPrice: appliedFilters.minPrice ?? undefined,
    maxPrice: appliedFilters.maxPrice ?? undefined,
    minRating: appliedFilters.minRating ?? undefined,
    inStock: appliedFilters.inStockOnly || undefined,
    sortBy: appliedFilters.sortBy as any,
    sortOrder: appliedFilters.sortOrder as any,
  }

  const { data: booksData, isLoading, isFetching } = useBooks(searchParams)

  const books = booksData?.books || []
  const total = booksData?.total || 0
  const totalPages = Math.ceil(total / limit)

  // Active filters based on APPLIED filters
  const activeFilters = [
    { id: 'title', label: `Title: ${appliedFilters.title}`, active: !!appliedFilters.title, reset: () => { setTitle(''); } },
    { id: 'author', label: `Author: ${appliedFilters.author}`, active: !!appliedFilters.author, reset: () => { setAuthor(''); } },
    { id: 'category', label: `Category: ${appliedFilters.category}`, active: !!appliedFilters.category, reset: () => { setCategory(''); } },
    { id: 'genre', label: `Genre: ${appliedFilters.genre}`, active: !!appliedFilters.genre, reset: () => { setGenre(''); } },
    { id: 'price', label: `Price: $${appliedFilters.minPrice || 0} - $${appliedFilters.maxPrice || '∞'}`, active: appliedFilters.minPrice !== null || appliedFilters.maxPrice !== null, reset: () => { setPriceRange(null, null); } },
    { id: 'rating', label: `${appliedFilters.minRating} Stars & Up`, active: !!appliedFilters.minRating, reset: () => { setMinRating(null); } },
    { id: 'stock', label: 'In Stock Only', active: appliedFilters.inStockOnly, reset: () => { setInStockOnly(false); } },
  ].filter(f => f.active)

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const applyAuthorQuickFilter = (author: string) => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const applyCategoryQuickFilter = (category: string) => {
    applyPresetFilters({
      title: '',
      author: '',
      category,
      genre: '',
      minPrice: null,
      maxPrice: null,
      minRating: null,
      inStockOnly: false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50/40 dark:bg-slate-950">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <FilterSidebar className="w-full lg:w-auto" />

          {/* Main Content */}
          <div className="flex-1 min-w-0" ref={scrollRef}>
            <PromoTicker className="mb-4 opacity-90" />
            <PromoShowcase compact className="mb-6" />

            <header className="mb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-black text-gray-900 tracking-tight mb-2 dark:text-slate-100"
                  >
                    Browse Collections
                  </motion.h1>
                  <p className="text-gray-500 font-medium dark:text-slate-400">
                    Discover your next favorite story among {total} curated books
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/70 p-1 dark:border-slate-800 dark:bg-slate-900/70">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition",
                      viewMode === 'list' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                    aria-label="List view"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition",
                      viewMode === 'grid' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                    aria-label="Grid view"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Active Filter Chips */}
              <AnimatePresence>
                {activeFilters.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-wrap items-center gap-2 mt-6"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mr-2 dark:text-slate-500">Active Filters:</span>
                    {activeFilters.map(filter => (
                      <motion.button
                        key={filter.id}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={filter.reset}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/75 border border-gray-200/70 rounded-full hover:border-primary-100 group transition-all dark:bg-slate-900/70 dark:border-slate-800"
                      >
                        <span className="text-xs font-bold text-gray-700 group-hover:text-primary-700 dark:text-slate-200">{filter.label}</span>
                        <div className="w-4 h-4 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors dark:bg-slate-800">
                          <svg className="w-2.5 h-2.5 text-gray-400 group-hover:text-primary-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </motion.button>
                    ))}
                    <button
                      onClick={resetFilters}
                      className="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 ml-2"
                    >
                      Clear All
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {/* Books Grid */}
            {(isLoading || (isFetching && books.length === 0)) ? (
              <div className={cn(
                "gap-6",
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  : "space-y-4"
              )}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={cn(
                    "bg-white/75 rounded-2xl border border-gray-200/70 p-5 animate-pulse dark:bg-slate-900/70 dark:border-slate-800",
                    viewMode === 'grid' ? "space-y-6" : "flex items-center gap-4"
                  )}>
                    <div className={cn(
                      "bg-gray-100 rounded-xl dark:bg-slate-800",
                      viewMode === 'grid' ? "aspect-[2/3]" : "h-24 w-16"
                    )}></div>
                    {viewMode === 'grid' ? (
                      <div className="space-y-3">
                        <div className="h-5 bg-gray-100 rounded-full w-3/4 dark:bg-slate-800"></div>
                        <div className="h-4 bg-gray-100 rounded-full w-1/2 dark:bg-slate-800"></div>
                      </div>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded-full w-2/3 dark:bg-slate-800"></div>
                        <div className="h-3 bg-gray-100 rounded-full w-1/3 dark:bg-slate-800"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : books.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {books.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onAuthorClick={applyAuthorQuickFilter}
                        onCategoryClick={applyCategoryQuickFilter}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {books.map((book) => (
                      <Link
                        key={book.id}
                        to={`/books/${book.id}`}
                        className="group flex items-center gap-4 rounded-2xl border border-gray-200/70 bg-white/80 p-4 transition hover:-translate-y-0.5 dark:bg-slate-900/70 dark:border-slate-800"
                      >
                        <div className="relative h-24 w-16 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
                          {isBestSellerBook(book) && <BookCornerRibbon className="h-16 w-16" />}
                          <BookCover
                            src={book.coverImage}
                            alt={book.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-gray-900 dark:text-slate-100">
                            {book.title}
                          </p>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              applyAuthorQuickFilter(book.author)
                            }}
                            className="text-sm text-gray-500 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-amber-300"
                          >
                            by {book.author}
                          </button>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            {(book.categories || []).slice(0, 2).map((cat, idx) => (
                              <button
                                key={`cat-${idx}`}
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  applyCategoryQuickFilter(cat)
                                }}
                                className="rounded-full bg-gray-100/80 px-2 py-0.5 transition hover:text-primary-700 dark:bg-slate-800 dark:hover:text-amber-300"
                              >
                                {cat}
                              </button>
                            ))}
                            {(book.genres || []).slice(0, 2).map((genre, idx) => (
                              <span key={`genre-${idx}`} className="rounded-full bg-gray-100/80 px-2 py-0.5 dark:bg-slate-800">
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                        {(book.rating ?? 0) > 0 && (
                          <div className="text-xs font-bold text-gray-600 dark:text-slate-300">
                            ★ {book.rating?.toFixed(1)}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <footer className="mt-12 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-gray-200/70 bg-white/75 p-2 dark:border-slate-800 dark:bg-slate-900/70">
                      <button
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={cn(
                          "p-2.5 rounded-xl transition-all border",
                          page === 1
                            ? "text-gray-300 border-transparent cursor-not-allowed dark:text-slate-600"
                            : "text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-100 active:scale-90 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-700"
                        )}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1
                          const isCurrent = pageNum === page

                          // Show smart pagination (first, last, and around current)
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            Math.abs(pageNum - page) <= 1
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={cn(
                                  "w-10 h-10 rounded-xl text-xs font-black transition-all border",
                                  isCurrent
                                    ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                                    : "bg-transparent text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900 active:scale-90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                )}
                              >
                                {pageNum}
                              </button>
                            )
                          }

                          if (
                            (pageNum === 2 && page > 3) ||
                            (pageNum === totalPages - 1 && page < totalPages - 2)
                          ) {
                            return <span key={pageNum} className="text-gray-300 px-1 dark:text-slate-600">•••</span>
                          }

                          return null
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className={cn(
                          "p-2.5 rounded-xl transition-all border",
                          page === totalPages
                            ? "text-gray-300 border-transparent cursor-not-allowed dark:text-slate-600"
                            : "text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-100 active:scale-90 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-700"
                        )}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      Page {page} of {totalPages} • {total} total books
                    </div>
                  </footer>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-3xl bg-white/70 py-20 dark:bg-slate-900/60"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 dark:bg-slate-800">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-slate-100">No books found</h3>
                <p className="text-gray-500 mb-8 max-w-xs text-center font-medium dark:text-slate-400">
                  We couldn't find any books matching your current filters. Try adjusting your search or categories.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl dark:bg-slate-100 dark:text-slate-900"
                >
                  Reset All Filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white active:bg-primary-700 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 border-2 border-white rounded-full flex items-center justify-center dark:bg-slate-100 dark:border-slate-900">
          <span className="text-[10px] font-black">{activeFilters.length}</span>
        </div>
      </motion.button>
    </div>
  )
}

export default BooksPage
