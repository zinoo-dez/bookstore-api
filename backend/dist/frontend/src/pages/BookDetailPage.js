import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBook } from '@/services/books';
const BookDetailPage = () => {
    const { id } = useParams();
    const { data: book, isLoading } = useBook(id);
    if (isLoading) {
        return (<div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>);
    }
    if (!book) {
        return <div className="text-center py-8">Book not found</div>;
    }
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-96 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
          <span className="text-8xl">📖</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
          <p className="text-2xl font-bold text-primary-600 mb-4">
            ${book.price.toFixed(2)}
          </p>
          <p className="text-gray-700 mb-6">{book.description}</p>
          <div className="space-y-2">
            <p><strong>ISBN:</strong> {book.isbn}</p>
            <p><strong>Stock:</strong> {book.stock} available</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${book.stockStatus === 'IN_STOCK'
            ? 'bg-green-100 text-green-800'
            : book.stockStatus === 'LOW_STOCK'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'}`}>
                {book.stockStatus.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>);
};
export default BookDetailPage;
//# sourceMappingURL=BookDetailPage.js.map