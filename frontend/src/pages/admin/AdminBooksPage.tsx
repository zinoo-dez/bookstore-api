import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CSVLink } from 'react-csv'
import { Pencil, Trash2 } from 'lucide-react'
import {
  useBooks,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
} from '@/services/books'
import { type Book } from '@/lib/schemas'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import BookFormModal from '@/components/admin/BookFormModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import BulkStockUpdateModal from '@/components/admin/BulkStockUpdateModal'
import { getErrorMessage } from '@/lib/api'

const ITEMS_PER_PAGE = 10

const AdminBooksPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN' | 'LOW' | 'OUT'>(
    'ALL'
  )
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = useState<Book | null>(null)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [sortKey, setSortKey] = useState<'title' | 'author' | 'isbn' | 'price' | 'stock' | 'createdAt'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [recentBookId, setRecentBookId] = useState<string | null>(null)

  const { data: booksData, isLoading } = useBooks({ limit: 100 })
  const createBook = useCreateBook()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()

  const books = booksData?.books || []

  // 🔍 Filter logic
  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm)

    let matchesStock = true
    if (stockFilter === 'IN') matchesStock = book.stock > 10
    if (stockFilter === 'LOW') matchesStock = book.stock > 0 && book.stock <= 10
    if (stockFilter === 'OUT') matchesStock = book.stock === 0

    return matchesSearch && matchesStock
  })

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'price':
        return (a.price - b.price) * dir
      case 'stock':
        return (a.stock - b.stock) * dir
      case 'createdAt':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      case 'author':
        return a.author.localeCompare(b.author) * dir
      case 'isbn':
        return a.isbn.localeCompare(b.isbn) * dir
      default:
        return a.title.localeCompare(b.title) * dir
    }
  })

  // 📄 Pagination logic
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage)
  const start = (page - 1) * itemsPerPage
  const end = start + itemsPerPage
  const paginatedBooks = sortedBooks.slice(start, end)

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleStockChange = (value: 'ALL' | 'IN' | 'LOW' | 'OUT') => {
    setStockFilter(value)
    setPage(1)
  }

  // CRUD handlers
  const handleAddBook = async (data: any) => {
    try {
      await createBook.mutateAsync(data)
      setIsAddModalOpen(false)
    } catch (err) {
      console.error('Failed to create book:', getErrorMessage(err))
    }
  }

  const handleEditBook = async (data: any) => {
    if (!editingBook) return
    try {
      const editedId = editingBook.id
      await updateBook.mutateAsync({ id: editingBook.id, data })
      setRecentBookId(editedId)
      setEditingBook(null)
    } catch (err) {
      console.error('Failed to update book:', getErrorMessage(err))
    }
  }

  const handleDeleteBook = async () => {
    if (!deletingBook) return
    try {
      await deleteBook.mutateAsync(deletingBook.id)
      setDeletingBook(null)
    } catch (err) {
      console.error('Failed to delete book:', getErrorMessage(err))
    }
  }

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(new Set(paginatedBooks.map(b => b.id)))
    } else {
      setSelectedBooks(new Set())
    }
  }

  const handleSelectBook = (bookId: string, checked: boolean) => {
    const newSelected = new Set(selectedBooks)
    if (checked) {
      newSelected.add(bookId)
    } else {
      newSelected.delete(bookId)
    }
    setSelectedBooks(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedBooks.size === 0) return
    setIsBulkDeleting(true)
    try {
      await Promise.all(
        Array.from(selectedBooks).map(id => deleteBook.mutateAsync(id))
      )
      setSelectedBooks(new Set())
    } catch (err) {
      console.error('Failed to delete books:', getErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkStockUpdate = async (stockChange: number) => {
    if (selectedBooks.size === 0) return
    try {
      const selectedBooksArray = books.filter(b => selectedBooks.has(b.id))
      await Promise.all(
        selectedBooksArray.map(book =>
          updateBook.mutateAsync({
            id: book.id,
            data: { stock: Math.max(0, book.stock + stockChange) },
          })
        )
      )
      setSelectedBooks(new Set())
      setIsBulkStockModalOpen(false)
    } catch (err) {
      console.error('Failed to update stock:', getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (!recentBookId) return
    const timeout = setTimeout(() => setRecentBookId(null), 2000)
    return () => clearTimeout(timeout)
  }, [recentBookId])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const densityPad = density === 'compact' ? 'py-2' : 'py-3'

  // CSV export data
  const csvData = filteredBooks.map(book => ({
    Title: book.title,
    Author: book.author,
    ISBN: book.isbn,
    Price: book.price,
    Stock: book.stock,
    Categories: book.categories?.join(', ') || '',
    Description: book.description || '',
  }))

  if (isLoading) {
    return (
      <div className="p-8 dark:text-slate-100 space-y-6">
        <Skeleton variant="logo" className="h-10 w-10" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p>
          <h1 className="text-2xl font-bold">Books Management</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage your book inventory</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>➕ Add New Book</Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-[1fr_200px_auto]">
        <input
          className="flex-1 px-4 py-2 border rounded-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          placeholder="Search by title, author, or ISBN..."
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />

        <select
          value={stockFilter}
          onChange={e => handleStockChange(e.target.value as any)}
          className="px-4 py-2 border rounded-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="ALL">All Status</option>
          <option value="IN">In Stock</option>
          <option value="LOW">Low Stock</option>
          <option value="OUT">Out of Stock</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Density</span>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                density === 'comfortable'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Comfy
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                density === 'compact'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBooks.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4 flex items-center justify-between dark:bg-amber-900/20 dark:border-amber-800/60">
          <p className="text-sm font-medium text-primary-900 dark:text-amber-200">
            {selectedBooks.size} book{selectedBooks.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkStockModalOpen(true)}
              className="dark:hover:text-amber-300 dark:hover:border-amber-300"
            >
              📦 Update Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="dark:hover:text-amber-300 dark:hover:border-amber-300"
            >
              {isBulkDeleting ? 'Deleting...' : '🗑️ Delete Selected'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBooks(new Set())}
              className="dark:hover:text-amber-300 dark:hover:border-amber-300"
            >
              ✕ Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mb-4 flex justify-end">
        <CSVLink
          data={csvData}
          filename={`books-export-${new Date().toISOString().split('T')[0]}.csv`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-amber-300 dark:hover:border-amber-300"
        >
          📥 Export to CSV
        </CSVLink>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 border-b dark:bg-slate-950/60 dark:border-slate-800 sticky top-0">
            <tr>
              <th className={`px-4 ${densityPad} text-left w-12 text-xs font-bold uppercase tracking-wider text-slate-500`}>
                <input
                  type="checkbox"
                  checked={paginatedBooks.length > 0 && paginatedBooks.every(b => selectedBooks.has(b.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-slate-700"
                />
              </th>
              <th className={`px-4 ${densityPad} text-left text-xs font-bold uppercase tracking-wider text-slate-500`}>#</th>
              <th className={`px-4 ${densityPad} text-left text-xs font-bold uppercase tracking-wider text-slate-500`}>
                <button type="button" onClick={() => toggleSort('title')} className="inline-flex items-center gap-2">
                  Book
                  {sortKey === 'title' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className={`px-4 ${densityPad} text-left text-xs font-bold uppercase tracking-wider text-slate-500`}>
                <button type="button" onClick={() => toggleSort('isbn')} className="inline-flex items-center gap-2">
                  ISBN
                  {sortKey === 'isbn' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className={`px-4 ${densityPad} text-left text-xs font-bold uppercase tracking-wider text-slate-500`}>
                <button type="button" onClick={() => toggleSort('price')} className="inline-flex items-center gap-2">
                  Price
                  {sortKey === 'price' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className={`px-4 ${densityPad} text-left text-xs font-bold uppercase tracking-wider text-slate-500`}>
                <button type="button" onClick={() => toggleSort('stock')} className="inline-flex items-center gap-2">
                  Stock
                  {sortKey === 'stock' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className={`px-4 ${densityPad} text-left text-xs font-bold uppercase tracking-wider text-slate-500`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedBooks.map((book, index) => (
              <motion.tr
                key={book.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-t dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 ${
                  recentBookId === book.id ? 'ring-2 ring-amber-300/60' : ''
                }`}
              >
                <td className={`px-4 ${densityPad}`}>
                  <input
                    type="checkbox"
                    checked={selectedBooks.has(book.id)}
                    onChange={(e) => handleSelectBook(book.id, e.target.checked)}
                    className="rounded border-gray-300 dark:border-slate-700"
                  />
                </td>
                <td className={`px-4 ${densityPad} text-sm text-slate-500 dark:text-slate-400`}>#{start + index + 1}</td>
                <td className={`px-4 ${densityPad}`}>
                  <div className="font-medium">{book.title}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{book.author}</div>
                </td>
                <td className={`px-4 ${densityPad} font-mono`}>{book.isbn}</td>
                <td className={`px-4 ${densityPad}`}>${book.price.toFixed(2)}</td>
                <td className={`px-4 ${densityPad}`}>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold ${book.stock === 0
                      ? 'bg-red-100 text-red-700 dark:bg-rose-900/40 dark:text-rose-200'
                      : book.stock <= 10
                        ? 'bg-orange-100 text-orange-700 dark:bg-amber-900/40 dark:text-amber-200'
                        : 'bg-green-100 text-green-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                      }`}
                  >
                    {book.stock === 0
                      ? 'OUT OF STOCK'
                      : book.stock <= 10
                        ? 'LOW STOCK'
                        : 'IN STOCK'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1 dark:text-slate-400">
                    {book.stock} units left
                  </div>
                </td>
                <td className={`px-4 ${densityPad}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingBook(book)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                      aria-label="Edit book"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                      onClick={() => setDeletingBook(book)}
                      aria-label="Delete book"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-3 border-t bg-gray-50 dark:bg-slate-950 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Showing {paginatedBooks.length} of {filteredBooks.length} books
          </p>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-800 dark:hover:text-amber-300 dark:hover:border-amber-300"
            >
              Previous
            </button>

            <span className="px-3 py-1 bg-primary-600 text-white rounded dark:bg-amber-400 dark:text-slate-900">
              {page}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-800 dark:hover:text-amber-300 dark:hover:border-amber-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddBook}
        isLoading={createBook.isPending}
      />

      <BookFormModal
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
        onSubmit={handleEditBook}
        book={editingBook}
        isLoading={updateBook.isPending}
      />

      <DeleteConfirmModal
        isOpen={!!deletingBook}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleDeleteBook}
        title="Delete Book"
        message={`Delete "${deletingBook?.title}"?`}
        isLoading={deleteBook.isPending}
      />

      <BulkStockUpdateModal
        isOpen={isBulkStockModalOpen}
        onClose={() => setIsBulkStockModalOpen(false)}
        onSubmit={handleBulkStockUpdate}
        selectedCount={selectedBooks.size}
      />
    </div>
  )
}

export default AdminBooksPage
