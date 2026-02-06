import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBook } from '@/services/books'
import { useAddToCart } from '@/services/cart'
import { useAuthStore } from '@/store/auth.store'
import Button from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'
import BookCover from '@/components/ui/BookCover'
import { getErrorMessage } from '@/lib/api'

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: book, isLoading } = useBook(id!)
  const addToCart = useAddToCart()
  const { isAuthenticated } = useAuthStore()
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isInCart, setIsInCart] = useState(false)
  const [totalInCart, setTotalInCart] = useState(0)

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
        <Loader size="lg" text="Loading book details..." />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Book not found</h2>
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
      className="max-w-6xl mx-auto px-4 py-8"
    >
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link to="/" className="text-gray-600 hover:text-primary-600">Home</Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link to="/books" className="text-gray-600 hover:text-primary-600">Books</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900">{book.title}</span>
      </nav>

      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between"
        >
          <span>✓ Added to cart successfully!</span>
          <Link to="/cart" className="text-green-600 hover:text-green-800 font-medium">
            View Cart
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Book Image */}
        <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
          <BookCover
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full"
          />
        </div>

        {/* Book Details */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-6">by {book.author}</p>

          {/* Price */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-primary-600">
              ${book.price.toFixed(2)}
            </p>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="font-medium">Availability:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                book.stockStatus === 'IN_STOCK' 
                  ? 'bg-green-100 text-green-800'
                  : book.stockStatus === 'LOW_STOCK'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">{book.description}</p>
          </div>

          {/* Book Details */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Book Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ISBN:</span>
                <span className="font-medium">{book.isbn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Author:</span>
                <span className="font-medium">{book.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock Status:</span>
                <span className="font-medium">{book.stockStatus.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Add to Cart Section */}
          {book.inStock ? (
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-medium"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center border border-gray-300 rounded-lg py-2 font-medium"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-medium"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">
                    (Max: {maxQuantity})
                  </span>
                </div>
                {isInCart && (
                  <p className="text-sm text-gray-600 mt-2">
                    {totalInCart} already in cart
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  size="lg"
                >
                  🛒 Add to Cart
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
                <p className="text-sm text-gray-600 text-center">
                  Please <Link to="/login" className="text-primary-600 hover:underline">login</Link> to add items to cart
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">This book is currently out of stock</p>
              <p className="text-red-600 text-sm mt-1">Check back later or browse similar books</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-2xl mb-1">🚚</div>
                <p className="font-medium">Free Shipping</p>
                <p className="text-gray-600">On all orders</p>
              </div>
              <div>
                <div className="text-2xl mb-1">↩️</div>
                <p className="font-medium">Easy Returns</p>
                <p className="text-gray-600">30-day policy</p>
              </div>
              <div>
                <div className="text-2xl mb-1">🔒</div>
                <p className="font-medium">Secure Payment</p>
                <p className="text-gray-600">100% protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BookDetailPage