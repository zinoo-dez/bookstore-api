import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBooks } from '@/services/books'
import BookCover from '@/components/ui/BookCover'

const HomePage = () => {
  const { data: booksData, isLoading } = useBooks({ limit: 6 })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to Our Bookstore
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover your next favorite book from our carefully curated collection
        </p>
        <Link
          to="/books"
          className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Browse Books
        </Link>
      </motion.div>

      {/* Featured Books */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Featured Books
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 relative"
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {book.title}
                </h3>
                <p className="text-gray-600 mb-2">by {book.author}</p>

                {/* Categories */}
                {book.categories && book.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {book.categories.slice(0, 2).map((cat: string, idx: number) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-primary-600 font-bold text-xl mb-4">
                  ${Number(book.price).toFixed(2)}
                </p>
                <Link
                  to={`/books/${book.id}`}
                  className="block w-full bg-primary-600 text-white text-center py-2 rounded hover:bg-primary-700 transition-colors"
                >
                  View Details
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🚚</div>
          <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
          <p className="text-gray-600">Get your books delivered quickly and safely</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
          <p className="text-gray-600">Your payment information is always protected</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">📞</div>
          <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
          <p className="text-gray-600">We're here to help whenever you need us</p>
        </div>
      </motion.section>
    </div>
  )
}

export default HomePage