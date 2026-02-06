import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBooks } from '@/services/books'
import { useAddToCart } from '@/services/cart'
import { useAuthStore } from '@/store/auth.store'
import BookCover from '@/components/ui/BookCover'

const BooksPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 12,
    title: '',
    author: '',
    sortBy: 'title' as const,
    sortOrder: 'asc' as const,
  })

  const { data: booksData, isLoading } = useBooks(searchParams)
  const addToCart = useAddToCart()
  const { isAuthenticated } = useAuthStore()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(prev => ({ ...prev, page: 1 }))
  }

  const handleAddToCart = async (book: any) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    try {
      await addToCart.mutateAsync({
        bookId: book.id,
        quantity: 1,
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Books</h1>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Title
              </label>
              <input
                type="text"
                value={searchParams.title}
                onChange={(e) => setSearchParams(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter book title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Author
              </label>
              <input
                type="text"
                value={searchParams.author}
                onChange={(e) => setSearchParams(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter author name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={searchParams.sortBy}
                onChange={(e) => setSearchParams(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="price">Price</option>
                <option value="createdAt">Date Added</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {booksData?.books.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <BookCover
                    src={book.coverImage}
                    alt={book.title}
                    className="h-48 rounded mb-4"
                  />
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 mb-2">by {book.author}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-primary-600 font-bold text-xl">
                      ${book.price.toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      book.stockStatus === 'IN_STOCK' 
                        ? 'bg-green-100 text-green-800'
                        : book.stockStatus === 'LOW_STOCK'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.stock} in stock
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Link
                      to={`/books/${book.id}`}
                      className="block w-full text-center py-2 border border-primary-600 text-primary-600 rounded hover:bg-primary-50 transition-colors"
                    >
                      View Details
                    </Link>
                    
                    {isAuthenticated && book.inStock && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddToCart(book)}
                        className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors"
                      >
                        Add to Cart
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {booksData && booksData.totalPages !== undefined && booksData.totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {[...Array(booksData.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchParams(prev => ({ ...prev, page: i + 1 }))}
                    className={`px-4 py-2 rounded ${
                      searchParams.page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default BooksPage