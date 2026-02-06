import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  useBooks,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
} from '@/services/books'
import { type Book } from '@/lib/schemas'
import Loader from '@/components/ui/Loader'
import Button from '@/components/ui/Button'
import BookFormModal from '@/components/admin/BookFormModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import { getErrorMessage } from '@/lib/api'

const ITEMS_PER_PAGE = 10

const AdminBooksPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN' | 'LOW' | 'OUT'>(
    'ALL'
  )
  const [page, setPage] = useState(1)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = useState<Book | null>(null)

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

  // 📄 Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE)
  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const paginatedBooks = filteredBooks.slice(start, end)

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
      await updateBook.mutateAsync({ id: editingBook.id, data })
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

  if (isLoading) {
    return (
      <div className="p-8">
        <Loader size="lg" text="Loading books..." />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Books Management</h1>
          <p className="text-gray-600">Manage your book inventory</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>➕ Add New Book</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <input
          className="flex-1 px-4 py-2 border rounded-lg"
          placeholder="Search by title, author, or ISBN..."
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />

        <select
          value={stockFilter}
          onChange={e => handleStockChange(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="ALL">All Status</option>
          <option value="IN">In Stock</option>
          <option value="LOW">Low Stock</option>
          <option value="OUT">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Book</th>
              <th className="px-4 py-3 text-left">ISBN</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedBooks.map((book, index) => (
              <motion.tr
                key={book.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t"
              >
                <td className="px-4 py-3">#{start + index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{book.title}</div>
                  <div className="text-sm text-gray-500">{book.author}</div>
                </td>
                <td className="px-4 py-3 font-mono">{book.isbn}</td>
                <td className="px-4 py-3">${book.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      book.stock === 0
                        ? 'bg-red-100 text-red-700'
                        : book.stock <= 10
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {book.stock === 0
                      ? 'OUT OF STOCK'
                      : book.stock <= 10
                      ? 'LOW STOCK'
                      : 'IN STOCK'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {book.stock} units left
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setEditingBook(book)}>✏️</button>
                  <button
                    className="ml-2"
                    onClick={() => setDeletingBook(book)}
                  >
                    🗑️
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {paginatedBooks.length} of {filteredBooks.length} books
          </p>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="px-3 py-1 bg-primary-600 text-white rounded">
              {page}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
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
    </div>
  )
}

export default AdminBooksPage
