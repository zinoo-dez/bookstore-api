import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useAddToCart } from '@/services/cart'
import BookCover from '@/components/ui/BookCover'
import type { Book } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface BookCardProps {
    book: Book
    index: number
}

const BookCard = ({ book, index }: BookCardProps) => {
    const { isAuthenticated } = useAuthStore()
    const addToCart = useAddToCart()

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden relative dark:bg-slate-900 dark:border-slate-800"
        >
            <Link to={`/books/${book.id}`} className="block p-5">
                {/* Rating Badge */}
                {book.rating !== null && book.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm flex items-center gap-1.5 z-10 border border-gray-50 dark:bg-slate-950/90 dark:border-slate-800">
                        <span className="text-yellow-400 text-sm leading-none">★</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                            {book.rating.toFixed(1)}
                        </span>
                    </div>
                )}

                <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <BookCover
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full transform group-hover:scale-110 transition-transform duration-500 object-cover"
                    />
                    {!book.inStock && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-white/90 text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors dark:text-slate-100">
                    {book.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 font-medium italic dark:text-slate-400">by {book.author}</p>

                {/* Categories */}
                {book.categories && book.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {book.categories.slice(0, 2).map((cat: string, idx: number) => (
                            <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md border border-primary-100/50">
                                {cat}
                            </span>
                        ))}
                        {book.categories.length > 2 && (
                            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">+{book.categories.length - 2} more</span>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-gray-900 leading-none dark:text-slate-100">
                            ${Number(book.price).toFixed(2)}
                        </span>
                    </div>
                    <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                        book.stockStatus === 'IN_STOCK'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : book.stockStatus === 'LOW_STOCK'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                    )}>
                        {book.stockStatus.replace('_', ' ')}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        className="w-full text-center py-2.5 text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        View Details
                    </button>

                    {isAuthenticated && (
                        <motion.button
                            whileHover={book.inStock ? { y: -1 } : {}}
                            whileTap={book.inStock ? { scale: 0.98 } : {}}
                            disabled={!book.inStock || addToCart.isPending}
                            onClick={handleAddToCart}
                            className={cn(
                                "w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm",
                                book.inStock
                                    ? "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg shadow-primary-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            {addToCart.isPending ? 'Adding...' : book.inStock ? 'Add to Cart' : 'Sold Out'}
                        </motion.button>
                    )}
                </div>
            </Link>
        </motion.div>
    )
}

export default BookCard
