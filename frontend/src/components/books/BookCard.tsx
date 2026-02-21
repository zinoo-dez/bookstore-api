import { Link } from 'react-router-dom'
import BookCover from '@/components/ui/BookCover'
import BookCornerRibbon from '@/components/ui/BookCornerRibbon'
import { isBestSellerBook } from '@/lib/books'
import type { Book } from '@/lib/schemas'

interface BookCardProps {
    book: Book
    onAuthorClick?: (author: string) => void
    onCategoryClick?: (category: string) => void
}

const BookCard = ({ book, onAuthorClick, onCategoryClick }: BookCardProps) => {
    const isBestSeller = isBestSellerBook(book)
    const stockTone = book.stock <= 0
        ? 'text-rose-600 dark:text-rose-300'
        : book.stock <= 5
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-emerald-700 dark:text-emerald-300'

    const stockLabel = book.stock <= 0
        ? 'Out of stock'
        : book.stock <= 5
            ? `Only ${book.stock} left`
            : 'In stock'

    return (
        <div
            className="group relative rounded-xl border border-gray-200/55 bg-white/72 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900/62"
        >
            <Link to={`/books/${book.id}`} className="block p-4">
                {(book.rating ?? 0) > 0 && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-slate-800 shadow-sm dark:bg-slate-950/90 dark:text-slate-100">
                        <span className="text-yellow-400 text-sm leading-none">★</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                            {book.rating?.toFixed(1)}
                        </span>
                    </div>
                )}

                <div className="relative aspect-[2/3] transition-shadow">
                    {isBestSeller && <BookCornerRibbon />}
                    <BookCover
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        variant="physical"
                    />
                </div>
            </Link>

            <div className="px-4 pb-4">
                <p className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-slate-100">{book.title}</p>
                <button
                    type="button"
                    onClick={() => onAuthorClick?.(book.author)}
                    className="line-clamp-1 text-left text-xs text-gray-500 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-amber-300"
                >
                    {book.author}
                </button>
                {(book.categories ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {(book.categories ?? []).slice(0, 2).map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => onCategoryClick?.(category)}
                                className="rounded-full bg-gray-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 transition hover:text-primary-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-amber-300"
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}
                <p className={`mt-1 text-xs font-semibold ${stockTone}`}>{stockLabel}</p>
            </div>
        </div>
    )
}

export default BookCard
