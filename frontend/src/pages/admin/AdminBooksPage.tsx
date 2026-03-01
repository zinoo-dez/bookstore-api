import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Columns, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import {
  useBooks,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  usePermanentDeleteBook,
  useEmptyBooksBin,
  useRestoreBook,
} from '@/services/books'
import { Link } from 'react-router-dom'
import { type Book } from '@/lib/schemas'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { BOOK_CATEGORIES, BOOK_GENRES } from '@/constants/bookTaxonomy'
import BookFormModal from '@/components/admin/BookFormModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import BulkStockUpdateModal from '@/components/admin/BulkStockUpdateModal'
import { getErrorMessage } from '@/lib/api'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const ITEMS_PER_PAGE = 10

type AdminBooksPageProps = {
  initialView?: 'active' | 'trash' | 'all'
  lockView?: boolean
  headerTitle?: string
  headerSubtitle?: string
}

const AdminBooksPage = ({
  initialView = 'active',
  lockView = false,
  headerTitle = 'Books Management',
  headerSubtitle = 'Manage your book inventory',
}: AdminBooksPageProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN' | 'LOW' | 'OUT'>(
    'ALL'
  )
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [genreFilter, setGenreFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const itemsPerPage = ITEMS_PER_PAGE

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = useState<Book | null>(null)
  const [permanentDeletingBook, setPermanentDeletingBook] = useState<Book | null>(null)
  const [isEmptyBinOpen, setIsEmptyBinOpen] = useState(false)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [binAnimationKey, setBinAnimationKey] = useState(0)
  const [sortKey, setSortKey] = useState<'title' | 'author' | 'isbn' | 'price' | 'stock' | 'createdAt'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [recentBookId, setRecentBookId] = useState<string | null>(null)
  const { message: actionMessage, showMessage: showActionMessage } = useTimedMessage(3400)
  const [viewMode, setViewMode] = useState<'active' | 'trash' | 'all'>(initialView)
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    author: true,
    categories: true,
    isbn: true,
    price: true,
    stock: true,
    actions: true,
  })
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false)

  const createBook = useCreateBook()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()
  const permanentDeleteBook = usePermanentDeleteBook()
  const emptyBin = useEmptyBooksBin()
  const restoreBook = useRestoreBook()

  const showViewSwitcher = !lockView
  const showAddButton = !(lockView && initialView === 'trash')
  const showBinShortcut = !lockView && initialView === 'active'

  const effectiveView = lockView ? initialView : viewMode
  const { data: booksData, isLoading } = useBooks({
    limit: 100,
    status: effectiveView === 'trash' ? 'trashed' : effectiveView === 'all' ? 'all' : 'active',
  })
  const { data: binCountData } = useBooks(
    { page: 1, limit: 1, status: 'trashed' },
    { enabled: showViewSwitcher }
  )

  useEffect(() => {
    if (!lockView) return
    setViewMode(initialView)
  }, [initialView, lockView])

  const books = booksData?.books || []
  const visibleBooks =
    effectiveView === 'trash'
      ? books.filter((book) => book.deletedAt)
      : effectiveView === 'active'
        ? books.filter((book) => !book.deletedAt)
        : books
  const binCount = showViewSwitcher ? (binCountData?.total ?? 0) : (booksData?.total ?? 0)
  const isTrashView = effectiveView === 'trash'
  const isActiveView = effectiveView === 'active'
  const selectedBooksArray = books.filter((book) => selectedBooks.has(book.id))
  const selectedActiveBooks = selectedBooksArray.filter((book) => !book.deletedAt)
  const selectedTrashedBooks = selectedBooksArray.filter((book) => book.deletedAt)

  // 🔍 Filter logic
  const filteredBooks = visibleBooks.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm)

    let matchesStock = true
    if (stockFilter === 'IN') matchesStock = book.stock > 10
    if (stockFilter === 'LOW') matchesStock = book.stock > 0 && book.stock <= 10
    if (stockFilter === 'OUT') matchesStock = book.stock === 0

    const matchesCategory =
      categoryFilter === 'ALL' || (book.categories || []).includes(categoryFilter)
    const matchesGenre =
      genreFilter === 'ALL' || (book.genres || []).includes(genreFilter)

    return matchesSearch && matchesStock && matchesCategory && matchesGenre
  })

  const allCategories = [...BOOK_CATEGORIES]
  const allGenres = [...BOOK_GENRES]

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

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setPage(1)
  }

  const handleGenreChange = (value: string) => {
    setGenreFilter(value)
    setPage(1)
  }

  // CRUD handlers
  const handleAddBook = async (data: any) => {
    try {
      await createBook.mutateAsync(data)
      setIsAddModalOpen(false)
      showActionMessage('Book created.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleEditBook = async (data: any) => {
    if (!editingBook) return
    try {
      const editedId = editingBook.id
      await updateBook.mutateAsync({ id: editingBook.id, data })
      setRecentBookId(editedId)
      setEditingBook(null)
      showActionMessage('Book updated.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleDeleteBook = async () => {
    if (!deletingBook) return
    try {
      await deleteBook.mutateAsync(deletingBook.id)
      setDeletingBook(null)
      showActionMessage('Book removed and sent to bin.')
      setBinAnimationKey((prev) => prev + 1)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handlePermanentDeleteBook = async () => {
    if (!permanentDeletingBook) return
    try {
      await permanentDeleteBook.mutateAsync(permanentDeletingBook.id)
      setPermanentDeletingBook(null)
      showActionMessage('Book permanently deleted.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleEmptyBin = async () => {
    try {
      const result = await emptyBin.mutateAsync()
      setIsEmptyBinOpen(false)
      showActionMessage(`Bin emptied. ${result.deleted} book${result.deleted === 1 ? '' : 's'} deleted.`)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleRestoreBook = async (book: Book) => {
    try {
      await restoreBook.mutateAsync(book.id)
      showActionMessage('Book restored.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
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
    if (selectedActiveBooks.length === 0) return
    setIsBulkDeleting(true)
    try {
      const results = await Promise.allSettled(
        selectedActiveBooks.map((book) => deleteBook.mutateAsync(book.id)),
      )
      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = results.length - failed.length
      setSelectedBooks(new Set())
      if (failed.length > 0) {
        const firstError = failed[0] as PromiseRejectedResult
        showActionMessage(
          `${succeeded} deleted, ${failed.length} failed: ${getErrorMessage(firstError.reason)}`,
        )
        return
      }
      showActionMessage(`${succeeded} books moved to bin.`)
      if (succeeded > 0) {
        setBinAnimationKey((prev) => prev + 1)
      }
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkRestore = async () => {
    if (selectedTrashedBooks.length === 0) return
    setIsBulkDeleting(true)
    try {
      const results = await Promise.allSettled(
        selectedTrashedBooks.map((book) => restoreBook.mutateAsync(book.id)),
      )
      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = results.length - failed.length
      setSelectedBooks(new Set())
      if (failed.length > 0) {
        const firstError = failed[0] as PromiseRejectedResult
        showActionMessage(
          `${succeeded} restored, ${failed.length} failed: ${getErrorMessage(firstError.reason)}`,
        )
        return
      }
      showActionMessage(`${succeeded} books restored.`)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkPermanentDelete = async () => {
    if (selectedTrashedBooks.length === 0) return
    const confirmed = window.confirm(
      `Permanently delete ${selectedTrashedBooks.length} book${selectedTrashedBooks.length > 1 ? 's' : ''}? This cannot be undone.`,
    )
    if (!confirmed) return
    setIsBulkDeleting(true)
    try {
      const results = await Promise.allSettled(
        selectedTrashedBooks.map((book) => permanentDeleteBook.mutateAsync(book.id)),
      )
      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = results.length - failed.length
      setSelectedBooks(new Set())
      if (failed.length > 0) {
        const firstError = failed[0] as PromiseRejectedResult
        showActionMessage(
          `${succeeded} deleted, ${failed.length} failed: ${getErrorMessage(firstError.reason)}`,
        )
        return
      }
      showActionMessage(`${succeeded} books permanently deleted.`)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkStockUpdate = async (stockChange: number) => {
    if (selectedActiveBooks.length === 0) return
    try {
      await Promise.all(
        selectedActiveBooks.map(book =>
          updateBook.mutateAsync({
            id: book.id,
            data: { stock: Math.max(0, book.stock + stockChange) },
          })
        )
      )
      setSelectedBooks(new Set())
      setIsBulkStockModalOpen(false)
      showActionMessage('Stock updated for selected books.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (!recentBookId) return
    const timeout = setTimeout(() => setRecentBookId(null), 2000)
    return () => clearTimeout(timeout)
  }, [recentBookId])

  useEffect(() => {
    setPage(1)
    setSelectedBooks(new Set())
  }, [viewMode])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rowPad = 'py-3'
  const columnKeys = Object.keys(visibleColumns) as Array<keyof typeof visibleColumns>
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'categories', label: 'Categories' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'actions', label: 'Actions' },
  ]

  const setAllColumns = (nextValue: boolean) => {
    setVisibleColumns((prev) => {
      const next = { ...prev }
      columnKeys.forEach((key) => {
        next[key] = nextValue
      })
      return next
    })
  }
  const visibleCount = columnKeys.filter((key) => visibleColumns[key]).length

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

  const handleExportCsv = () => {
    if (csvData.length === 0) return

    const headers = Object.keys(csvData[0])
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = csvData.map((row) => headers.map((header) => escapeCsv(row[header as keyof typeof row])).join(','))
    const csv = [headers.join(','), ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `books-export-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
          <h1 className="text-2xl font-bold">{headerTitle}</h1>
          <p className="text-gray-600 dark:text-slate-400">{headerSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {showBinShortcut && (
            <Link
              to="/admin/books/bin"
              className="group relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-300 hover:text-amber-400 dark:border-slate-800 dark:bg-slate-900"
              aria-label="Open books bin"
              title="Open books bin"
            >
              <div className="relative flex h-6 w-6 items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-slate-500/90 dark:text-slate-300/90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.g
                    key={`lid-${binAnimationKey}`}
                    initial={{ rotate: 0, y: 0 }}
                    animate={{ rotate: [0, -18, 0], y: [0, -1.5, 0] }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    style={{ transformOrigin: '12px 6px' }}
                  >
                    <path d="M4 7h16" />
                    <path d="M9 4h6" />
                  </motion.g>
                  <path d="M6 7l1 13h10l1-13" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
                <motion.div
                  key={`drop-${binAnimationKey}`}
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 0], y: [-10, 2, 10], scale: [0.8, 1, 0.6] }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  className="absolute -top-2 h-2 w-2 rounded-full bg-amber-400/90"
                />
              </div>
            </Link>
          )}
          {isTrashView && (
            <button
              type="button"
              onClick={() => setIsEmptyBinOpen(true)}
              disabled={binCount === 0}
              className="inline-flex items-center justify-center rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-400/50 dark:text-amber-200 dark:hover:border-rose-300"
            >
              Empty Bin
            </button>
          )}
          {showAddButton && (
            <Button onClick={() => setIsAddModalOpen(true)}>➕ Add New Book</Button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {actionMessage}
        </div>
      )}



      {/* Search + Filters + Columns + Export */}
      <div className="relative mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="h-12 min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-base text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-amber-300 dark:focus:ring-amber-500/20"
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
          <div className="relative w-[170px]">
            <select
              value={stockFilter}
              onChange={e => handleStockChange(e.target.value as any)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 pr-10 text-base text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-amber-300 dark:focus:ring-amber-500/20"
            >
              <option value="ALL">All Status</option>
              <option value="IN">In Stock</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT">Out of Stock</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          </div>
          <div className="relative w-[190px]">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 pr-10 text-base text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-amber-300 dark:focus:ring-amber-500/20"
            >
              <option value="ALL">All Categories</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          </div>
          <div className="relative w-[190px]">
            <select
              value={genreFilter}
              onChange={(e) => handleGenreChange(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 pr-10 text-base text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-amber-300 dark:focus:ring-amber-500/20"
            >
              <option value="ALL">All Genres</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnsMenuOpen((prev) => !prev)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-amber-500/20"
            >
              <Columns className="h-4 w-4" />
              Columns ({visibleCount}/{columnOptions.length})
              <ChevronDown className={`h-4 w-4 transition ${isColumnsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isColumnsMenuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Show Columns</p>
                  <button
                    type="button"
                    onClick={() => setAllColumns(true)}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-500 dark:border-slate-700 dark:text-slate-300"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {columnOptions.map((column) => {
                    const active = visibleColumns[column.key]
                    return (
                      <button
                        key={column.key}
                        type="button"
                        onClick={() =>
                          setVisibleColumns((prev) => ({ ...prev, [column.key]: !active }))
                        }
                        aria-pressed={active}
                        className={`inline-flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                          active
                            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/60 dark:bg-amber-900/30 dark:text-amber-200'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{column.label}</span>
                        {active && <Check className="h-3.5 w-3.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={csvData.length === 0}
            className="ml-auto inline-flex h-12 items-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-amber-300 dark:hover:text-amber-300"
          >
            📥 Export CSV
          </button>
        </div>

      </div>

      {/* Bulk Actions Bar */}
      {selectedBooks.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4 flex items-center justify-between dark:bg-amber-900/20 dark:border-amber-800/60">
          <p className="text-sm font-medium text-primary-900 dark:text-amber-200">
            {selectedBooks.size} book{selectedBooks.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            {selectedActiveBooks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkStockModalOpen(true)}
                className="dark:hover:text-amber-300 dark:hover:border-amber-300"
              >
                📦 Update Stock
              </Button>
            )}
            {selectedActiveBooks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="dark:hover:text-amber-300 dark:hover:border-amber-300"
              >
                {isBulkDeleting ? 'Removing...' : '🗑️ Remove (To Bin)'}
              </Button>
            )}
            {selectedTrashedBooks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRestore}
                disabled={isBulkDeleting}
                className="dark:hover:text-amber-300 dark:hover:border-amber-300"
              >
                {isBulkDeleting ? 'Restoring...' : '↩️ Restore Selected'}
              </Button>
            )}
            {selectedTrashedBooks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPermanentDelete}
                disabled={isBulkDeleting}
                className="dark:hover:text-rose-300 dark:hover:border-rose-300"
              >
                {isBulkDeleting ? 'Deleting...' : '🗑️ Delete Forever'}
              </Button>
            )}
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

      {/* Table */}
      <div className="admin-table-wrapper">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1100px]">
            <thead className="admin-table-head sticky top-0">
            <tr>
              <th className={`px-4 ${rowPad} text-left w-12 text-base font-semibold uppercase tracking-wide text-slate-500`}>
                <input
                  type="checkbox"
                  checked={paginatedBooks.length > 0 && paginatedBooks.every(b => selectedBooks.has(b.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-slate-700"
                />
              </th>
              <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>#</th>
              {visibleColumns.title && (
                <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>
                  <button type="button" onClick={() => toggleSort('title')} className="inline-flex items-center gap-2">
                    Title
                    {sortKey === 'title' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.author && (
                <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>
                  <button type="button" onClick={() => toggleSort('author')} className="inline-flex items-center gap-2">
                    Author
                    {sortKey === 'author' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.categories && (
                <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>Categories</th>
              )}
              {visibleColumns.isbn && (
                <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>
                  <button type="button" onClick={() => toggleSort('isbn')} className="inline-flex items-center gap-2">
                    ISBN
                    {sortKey === 'isbn' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.price && (
                <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>
                  <button type="button" onClick={() => toggleSort('price')} className="inline-flex items-center gap-2">
                    Price
                    {sortKey === 'price' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.stock && (
                <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>
                  <button type="button" onClick={() => toggleSort('stock')} className="inline-flex items-center gap-2">
                    Stock
                    {sortKey === 'stock' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.actions && (
                <th className={`px-4 ${rowPad} text-left text-base font-semibold uppercase tracking-wide text-slate-500`}>Actions</th>
              )}
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
                  } ${book.deletedAt ? 'opacity-70 grayscale-[10%]' : ''}`}
                >
                <td className={`px-4 ${rowPad}`}>
                  <input
                    type="checkbox"
                    checked={selectedBooks.has(book.id)}
                    onChange={(e) => handleSelectBook(book.id, e.target.checked)}
                    className="rounded border-gray-300 dark:border-slate-700"
                  />
                </td>
                <td className={`px-4 ${rowPad} text-sm text-slate-500 dark:text-slate-400`}>#{start + index + 1}</td>
                {visibleColumns.title && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{book.title}</span>
                      {book.deletedAt ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                          Removed
                        </span>
                      ) : isActiveView ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Active
                        </span>
                      ) : null}
                    </div>
                  </td>
                )}
                {visibleColumns.author && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="text-sm text-gray-700 dark:text-slate-200">{book.author}</div>
                  </td>
                )}
                {visibleColumns.categories && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="text-sm text-gray-600 dark:text-slate-300">
                      {book.categories?.length ? book.categories.join(', ') : '—'}
                    </div>
                  </td>
                )}
                {visibleColumns.isbn && (
                  <td className={`px-4 ${rowPad} font-mono`}>{book.isbn}</td>
                )}
                {visibleColumns.price && (
                  <td className={`px-4 ${rowPad}`}>${book.price.toFixed(2)}</td>
                )}
                {visibleColumns.stock && (
                  <td className={`px-4 ${rowPad}`}>
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
                )}
                {visibleColumns.actions && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="flex items-center gap-2">
                      {!book.deletedAt && (
                        <button
                          onClick={() => setEditingBook(book)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                          aria-label="Edit book"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {book.deletedAt ? (
                        <>
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-emerald-300 hover:text-emerald-300 transition-colors dark:border-slate-800"
                            onClick={() => handleRestoreBook(book)}
                            aria-label="Restore book"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-rose-300 hover:text-rose-300 transition-colors dark:border-slate-800"
                            onClick={() => setPermanentDeletingBook(book)}
                            aria-label="Delete book permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                          onClick={() => setDeletingBook(book)}
                          aria-label="Move book to bin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

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
        title="Remove Book"
        message={`Remove "${deletingBook?.title}"? It will be moved to the bin and hidden from users.`}
        confirmLabel="Remove"
        confirmClassName="bg-amber-600 hover:bg-amber-700"
        isLoading={deleteBook.isPending}
      />

      <DeleteConfirmModal
        isOpen={!!permanentDeletingBook}
        onClose={() => setPermanentDeletingBook(null)}
        onConfirm={handlePermanentDeleteBook}
        title="Delete Forever"
        message={`Permanently delete "${permanentDeletingBook?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={permanentDeleteBook.isPending}
      />

      <DeleteConfirmModal
        isOpen={isEmptyBinOpen}
        onClose={() => setIsEmptyBinOpen(false)}
        onConfirm={handleEmptyBin}
        title="Empty Bin"
        message="Permanently delete all removable books in the bin? This cannot be undone."
        confirmLabel="Delete All"
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={emptyBin.isPending}
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
