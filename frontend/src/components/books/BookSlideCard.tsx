import { Link } from 'react-router-dom'
import BookCover from '@/components/ui/BookCover'
import BookCornerRibbon from '@/components/ui/BookCornerRibbon'
import { isBestSellerBook } from '@/lib/books'
import type { Book } from '@/lib/schemas'

interface BookSlideCardProps {
  book: Book
}

const BookSlideCard = ({ book }: BookSlideCardProps) => {
  const isBestSeller = isBestSellerBook(book)

  return (
    <Link
      to={`/books/${book.id}`}
      className="group flex h-full w-44 flex-col items-center gap-3 sm:w-52"
    >
      <div className="relative w-full">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
          {isBestSeller && <BookCornerRibbon />}
          <BookCover
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div className="min-h-[2.5rem] text-center">
        <h3 className="text-sm font-semibold leading-snug text-slate-700 line-clamp-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {book.title}
        </h3>
        <p className="text-xs text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {book.author}
        </p>
      </div>
    </Link>
  )
}

export default BookSlideCard
