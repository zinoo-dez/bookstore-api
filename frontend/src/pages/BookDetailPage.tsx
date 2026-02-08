import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBook } from '@/services/books'
import { useBookReviews } from '@/services/reviews'
import { useAddToCart } from '@/services/cart'
import { useAuthStore } from '@/store/auth.store'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import BookCover from '@/components/ui/BookCover'
import StarRating from '@/components/ui/StarRating'
import ReviewForm from '@/components/books/ReviewForm'
import ReviewsList from '@/components/books/ReviewsList'
import { getErrorMessage } from '@/lib/api'

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: book, isLoading } = useBook(id!)
  const { data: reviews } = useBookReviews(id!)
  const addToCart = useAddToCart()
  const { isAuthenticated } = useAuthStore()
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const reviewCount = reviews?.length ?? 0
  const hasRating = book?.rating !== null && (book?.rating ?? 0) > 0

  const handleAddToCart = async () => {
    if (!book) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      setError('')
      await addToCart.mutateAsync({
        bookId: book.id,
        quantity: quantity,
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    if (!error) {
      setTimeout(() => navigate('/cart'), 500)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-900/40">
            <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
            <div className="mt-6 flex flex-wrap gap-2">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-6 w-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton variant="logo" className="h-10 w-10" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-8 w-40" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-12 w-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Book not found</h2>
        <Link to="/books">
          <Button>Browse Books</Button>
        </Link>
      </div>
    )
  }

  const maxQuantity = Math.min(book.stock, 10)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-50 dark:bg-slate-950"
    >
      <div className="relative isolate overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-900/40" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-900/30" />

        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link to="/books" className="hover:text-primary-600">Books</Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700 dark:text-slate-300">{book.title}</span>
          </nav>

          {/* Success Message */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              <span className="font-semibold">Added to cart successfully.</span>
              <Link to="/cart" className="text-emerald-700 hover:text-emerald-900 font-semibold">
                View Cart
              </Link>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12">
            {/* Book Image */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-900/40">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-sm">
                <BookCover
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full"
                />
              </div>
              {book.categories && book.categories.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {book.categories.map((cat, idx) => (
                    <span key={idx} className="text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-1 rounded-lg border border-primary-100/60 dark:bg-primary-900/40 dark:text-primary-200 dark:border-primary-900/50">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Book Details */}
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100">{book.title}</h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">by {book.author}</p>

              {/* Rating */}
              {(hasRating || reviewCount > 0) && (
                <div className="mt-6">
                  {hasRating && <StarRating rating={book.rating} size="lg" showNumber />}
                  <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Rated by {reviewCount}
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="mt-6 flex items-end gap-4">
                <p className="text-4xl font-black text-primary-600">
                  ${book.price.toFixed(2)}
                </p>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Ready to ship</span>
              </div>

              {/* Stock Status */}
              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Availability</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${book.stockStatus === 'IN_STOCK'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : book.stockStatus === 'LOW_STOCK'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                    {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-900 mb-2 dark:text-slate-100">Description</h2>
                <p className="text-slate-600 leading-relaxed dark:text-slate-400">{book.description}</p>
              </div>

              {/* Book Details */}
              <div className="mt-8 p-5 bg-white/80 rounded-2xl border border-slate-200/70 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                <h2 className="text-lg font-bold text-slate-900 mb-3 dark:text-slate-100">Book Details</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">ISBN</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{book.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Author</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{book.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Stock Status</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{book.stockStatus.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Section */}
              {book.inStock ? (
                <div className="mt-8 space-y-4">
                  {/* Quantity Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 dark:text-slate-400">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-lg font-semibold dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={maxQuantity}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-20 text-center border border-slate-200 rounded-xl py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-lg font-semibold dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        +
                      </button>
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Max {maxQuantity}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleAddToCart}
                      className="flex-1"
                      size="lg"
                    >
                      Add to Cart
                    </Button>
                    <Button
                      onClick={handleBuyNow}
                      variant="secondary"
                      className="flex-1"
                      size="lg"
                    >
                      Buy Now
                    </Button>
                  </div>

                  {!isAuthenticated && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 text-center dark:text-slate-400">
                      Please <Link to="/login" className="text-primary-600 hover:text-primary-700">login</Link> to add items to cart
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/60">
                  <p className="text-rose-800 font-semibold">This book is currently out of stock</p>
                  <p className="text-rose-600 text-sm mt-1">Check back later or browse similar books</p>
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-10 pt-8 border-t border-slate-200/70 dark:border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
                  {[
                    { title: 'Free Shipping', copy: 'On all orders' },
                    { title: 'Easy Returns', copy: '30-day policy' },
                    { title: 'Secure Payment', copy: '100% protected' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/80">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-black text-slate-900 mb-6 dark:text-slate-100">Reviews</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Review Form */}
              <div>
                <ReviewForm bookId={book.id} />
              </div>

              {/* Reviews List */}
              <div>
                <ReviewsList bookId={book.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BookDetailPage
