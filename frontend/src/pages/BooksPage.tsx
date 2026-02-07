import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBooks } from '@/services/books'
import { useFilterStore } from '@/store/filter.store'
import BookCard from '@/components/books/BookCard'
import FilterSidebar from '@/components/books/FilterSidebar'
import { cn } from '@/lib/utils'

const BooksPage = () => {
  const {
    page,
    limit,
    appliedFilters,
    setTitle,
    setAuthor,
    setCategory,
    setPriceRange,
    setMinRating,
    setInStockOnly,
    setPage,
    toggleMobileSidebar,
    resetFilters
  } = useFilterStore()

  const scrollRef = useRef<HTMLDivElement>(null)

  // Construct search params for the API using appliedFilters
  const searchParams = {
    page: appliedFilters.page,
    limit: appliedFilters.limit,
    title: appliedFilters.title,
    author: appliedFilters.author,
    category: appliedFilters.category,
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
    { id: 'price', label: `Price: $${appliedFilters.minPrice || 0} - $${appliedFilters.maxPrice || '∞'}`, active: appliedFilters.minPrice !== null || appliedFilters.maxPrice !== null, reset: () => { setPriceRange(null, null); } },
    { id: 'rating', label: `${appliedFilters.minRating} Stars & Up`, active: !!appliedFilters.minRating, reset: () => { setMinRating(null); } },
    { id: 'stock', label: 'In Stock Only', active: appliedFilters.inStockOnly, reset: () => { setInStockOnly(false); } },
  ].filter(f => f.active)

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar */}
          <FilterSidebar className="w-full lg:w-auto" />

          {/* Main Content */}
          <div className="flex-1 min-w-0" ref={scrollRef}>
            <header className="mb-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-black text-gray-900 tracking-tight mb-2"
                  >
                    Browse Collections
                  </motion.h1>
                  <p className="text-gray-500 font-medium">
                    Discover your next favorite story among {total} curated books
                  </p>
                </div>
              </div>

              {/* Active Filter Chips */}
              <AnimatePresence>
                {activeFilters.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-wrap items-center gap-2 mt-8"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mr-2">Active Filters:</span>
                    {activeFilters.map(filter => (
                      <motion.button
                        key={filter.id}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={filter.reset}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:shadow-md hover:border-primary-100 group transition-all"
                      >
                        <span className="text-xs font-bold text-gray-700 group-hover:text-primary-700">{filter.label}</span>
                        <div className="w-4 h-4 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                          <svg className="w-2.5 h-2.5 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6 animate-pulse">
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl"></div>
                    <div className="space-y-3">
                      <div className="h-5 bg-gray-100 rounded-full w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-8 bg-gray-100 rounded-full w-20"></div>
                      <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                  {books.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <footer className="mt-16 flex flex-col items-center gap-8">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                      <button
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={cn(
                          "p-2.5 rounded-xl transition-all border",
                          page === 1
                            ? "text-gray-300 border-transparent cursor-not-allowed"
                            : "text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-100 active:scale-90"
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
                                    : "bg-transparent text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900 active:scale-90"
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
                            return <span key={pageNum} className="text-gray-300 px-1">•••</span>
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
                            ? "text-gray-300 border-transparent cursor-not-allowed"
                            : "text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-100 active:scale-90"
                        )}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="px-6 py-2 bg-gray-50 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Page {page} of {totalPages} • {total} total books
                    </div>
                  </footer>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-500 mb-8 max-w-xs text-center font-medium">
                  We couldn't find any books matching your current filters. Try adjusting your search or categories.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
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
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 border-2 border-white rounded-full flex items-center justify-center">
          <span className="text-[10px] font-black">{activeFilters.length}</span>
        </div>
      </motion.button>
    </div>
  )
}

export default BooksPage
