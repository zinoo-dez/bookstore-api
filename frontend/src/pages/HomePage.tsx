import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBooks, usePopularBooks, useRecommendedBooks } from '@/services/books'
import BookCover from '@/components/ui/BookCover'
import { useAuthStore } from '@/store/auth.store'

const HomePage = () => {
  const { data: booksData, isLoading } = useBooks({ limit: 6 })
  const { isAuthenticated } = useAuthStore()
  const { data: popularBooks, isLoading: isPopularLoading } = usePopularBooks(6)
  const { data: recommendedBooks, isLoading: isRecommendedLoading } = useRecommendedBooks(6, isAuthenticated)

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-900/40" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-900/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                Modern Commerce
                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Discover your next favorite story with a sharper storefront.
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-xl dark:text-slate-300">
                Browse curated collections, get real-time stock updates, and check out in seconds.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/books"
                  className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary-200/60 transition-colors hover:bg-primary-700"
                >
                  Browse Books
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Create Account
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 text-left text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">24h</p>
                  <p className="mt-1">Fast dispatch on top sellers</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">99%</p>
                  <p className="mt-1">Inventory accuracy</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">4.9</p>
                  <p className="mt-1">Average reader rating</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-900/40">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Featured Selection
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">Updated Weekly</span>
                </div>
                <div className="mt-6 space-y-4">
                  {(booksData?.books || []).slice(0, 3).map((book) => (
                    <div key={book.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                      <BookCover
                        src={book.coverImage}
                        alt={book.title}
                        className="h-20 w-14 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{book.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">by {book.author}</p>
                        <p className="mt-2 text-sm font-bold text-primary-600">${Number(book.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  {!booksData?.books?.length && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      Loading curated picks...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Books */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Featured</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
              Fresh arrivals, curated weekly.
            </h2>
          </div>
          <Link
            to="/books"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 hover:text-primary-700"
          >
            View all
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h9.586L10.3 5.714a1 1 0 011.4-1.428l5 5a1 1 0 010 1.428l-5 5a1 1 0 11-1.4-1.428L13.586 11H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse dark:bg-slate-900 dark:border-slate-800">
                <div className="h-48 bg-slate-100 rounded-xl mb-4 dark:bg-slate-800"></div>
                <div className="h-4 bg-slate-100 rounded mb-2 dark:bg-slate-800"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3 dark:bg-slate-800"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {booksData?.books?.map((book, index: number) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-shadow p-6 relative dark:bg-slate-900 dark:border-slate-800"
              >
                {/* Rating Badge */}
                {book.rating !== null && book.rating > 0 && (
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-md flex items-center gap-1 z-10">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {book.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                <BookCover
                  src={book.coverImage}
                  alt={book.title}
                  className="h-48 rounded mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">
                  {book.title}
                </h3>
                <p className="text-gray-600 mb-2 dark:text-slate-400">by {book.author}</p>

                {/* Categories */}
                {book.categories && book.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {book.categories.slice(0, 2).map((cat: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-1 rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-primary-600 font-black text-xl mb-4">
                  ${Number(book.price).toFixed(2)}
                </p>
                <Link
                  to={`/books/${book.id}`}
                  className="block w-full bg-primary-600 text-white text-center py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200/60"
                >
                  View Details
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Popular Now */}
      {(isPopularLoading || (popularBooks && popularBooks.length > 0)) && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
        >
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Popular Now</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
                Most purchased by readers.
              </h2>
            </div>
            <Link
              to="/books"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 hover:text-primary-700"
            >
              Shop all
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h9.586L10.3 5.714a1 1 0 011.4-1.428l5 5a1 1 0 010 1.428l-5 5a1 1 0 11-1.4-1.428L13.586 11H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {isPopularLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse dark:bg-slate-900 dark:border-slate-800">
                  <div className="h-48 bg-slate-100 rounded-xl mb-4 dark:bg-slate-800"></div>
                  <div className="h-4 bg-slate-100 rounded mb-2 dark:bg-slate-800"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3 dark:bg-slate-800"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularBooks?.map((book, index: number) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-shadow p-6 relative dark:bg-slate-900 dark:border-slate-800"
                >
                  {book.rating !== null && book.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-md flex items-center gap-1 z-10">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {book.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  <BookCover
                    src={book.coverImage}
                    alt={book.title}
                    className="h-48 rounded mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 mb-2 dark:text-slate-400">by {book.author}</p>

                  {book.categories && book.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {book.categories.slice(0, 2).map((cat: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-1 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-primary-600 font-black text-xl mb-4">
                    ${Number(book.price).toFixed(2)}
                  </p>
                  <Link
                    to={`/books/${book.id}`}
                    className="block w-full bg-primary-600 text-white text-center py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200/60"
                  >
                    View Details
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* Recommended for You */}
      {isAuthenticated && (isRecommendedLoading || (recommendedBooks && recommendedBooks.length > 0)) && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
        >
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recommended For You</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
                Picks based on your latest genre.
              </h2>
            </div>
            <Link
              to="/books"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 hover:text-primary-700"
            >
              Explore more
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h9.586L10.3 5.714a1 1 0 011.4-1.428l5 5a1 1 0 010 1.428l-5 5a1 1 0 11-1.4-1.428L13.586 11H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {isRecommendedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse dark:bg-slate-900 dark:border-slate-800">
                  <div className="h-48 bg-slate-100 rounded-xl mb-4 dark:bg-slate-800"></div>
                  <div className="h-4 bg-slate-100 rounded mb-2 dark:bg-slate-800"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3 dark:bg-slate-800"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendedBooks?.map((book, index: number) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-shadow p-6 relative dark:bg-slate-900 dark:border-slate-800"
                >
                  {book.rating !== null && book.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-md flex items-center gap-1 z-10">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {book.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  <BookCover
                    src={book.coverImage}
                    alt={book.title}
                    className="h-48 rounded mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 mb-2 dark:text-slate-400">by {book.author}</p>

                  {book.categories && book.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {book.categories.slice(0, 2).map((cat: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-1 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-primary-600 font-black text-xl mb-4">
                    ${Number(book.price).toFixed(2)}
                  </p>
                  <Link
                    to={`/books/${book.id}`}
                    className="block w-full bg-primary-600 text-white text-center py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200/60"
                  >
                    View Details
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* Features */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Fast Dispatch',
              copy: 'Same-day processing on top titles.',
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h8a1 1 0 011 1v3h1.382a1 1 0 01.894.553l2.724 5.447A1 1 0 0118 14h-1a2 2 0 11-4 0H7a2 2 0 11-4 0H2a1 1 0 01-1-1V6a1 1 0 011-1h1V4z" />
                </svg>
              ),
            },
            {
              title: 'Secure Checkout',
              copy: 'Verified payments with buyer protection.',
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v7a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" clipRule="evenodd" />
                </svg>
              ),
            },
            {
              title: 'Real Support',
              copy: 'Live chat for orders and returns.',
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H8l-4 3v-3H4a2 2 0 01-2-2V5z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.copy}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

export default HomePage
