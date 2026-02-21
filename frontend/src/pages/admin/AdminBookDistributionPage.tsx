import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBooks } from '@/services/books'
import { useWarehouses } from '@/services/warehouses'
import { api, getErrorMessage } from '@/lib/api'

type ViewMode = 'table' | 'heatmap'

const AdminBookDistributionPage = () => {
  const [search, setSearch] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'isbn' | 'stock'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const { data: warehouses = [] } = useWarehouses()
  const { data: booksData } = useBooks({
    page: 1,
    limit: 100,
  })
  const books = booksData?.books ?? []

  const {
    data: stockDistributionMap = {},
    error,
    isLoading,
  } = useQuery({
    queryKey: ['book-distribution', warehouses.map((w) => w.id).join(',')],
    queryFn: async (): Promise<Record<string, Record<string, number>>> => {
      const responses = await Promise.all(
        warehouses.map(async (warehouse) => {
          const response = await api.get(`/warehouses/${warehouse.id}/stocks`)
          return {
            warehouseId: warehouse.id,
            rows: response.data as Array<{ bookId: string; stock: number }>,
          }
        }),
      )

      const distribution: Record<string, Record<string, number>> = {}
      for (const result of responses) {
        for (const row of result.rows) {
          if (!distribution[row.bookId]) distribution[row.bookId] = {}
          distribution[row.bookId][result.warehouseId] = row.stock
        }
      }
      return distribution
    },
    enabled: warehouses.length > 0,
    retry: false,
  })

  const visibleWarehouses = useMemo(() => {
    if (!selectedWarehouseId) return warehouses
    return warehouses.filter((warehouse) => warehouse.id === selectedWarehouseId)
  }, [selectedWarehouseId, warehouses])

  const filteredBooks = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return books
    return books.filter((book) =>
      book.title.toLowerCase().includes(keyword)
      || book.author.toLowerCase().includes(keyword)
      || book.isbn.toLowerCase().includes(keyword),
    )
  }, [books, search])

  const sortedBooks = useMemo(() => {
    const direction = sortDir === 'asc' ? 1 : -1
    return [...filteredBooks].sort((a, b) => {
      switch (sortBy) {
        case 'author':
          return a.author.localeCompare(b.author) * direction
        case 'isbn':
          return a.isbn.localeCompare(b.isbn) * direction
        case 'stock':
          return (a.stock - b.stock) * direction
        default:
          return a.title.localeCompare(b.title) * direction
      }
    })
  }, [filteredBooks, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / pageSize))
  const pageNumbers = useMemo(() => {
    const maxButtons = 5
    let start = Math.max(1, page - Math.floor(maxButtons / 2))
    const end = Math.min(totalPages, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [page, totalPages])
  const pagedBooks = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedBooks.slice(start, start + pageSize)
  }, [page, pageSize, sortedBooks])
  const startRow = sortedBooks.length === 0 ? 0 : (page - 1) * pageSize + 1
  const endRow = Math.min(page * pageSize, sortedBooks.length)

  const maxVisibleStock = useMemo(() => {
    const values = pagedBooks.flatMap((book) =>
      visibleWarehouses.map((warehouse) => stockDistributionMap[book.id]?.[warehouse.id] ?? 0),
    )
    return Math.max(1, ...values)
  }, [pagedBooks, visibleWarehouses, stockDistributionMap])

  useEffect(() => {
    setPage(1)
  }, [search, sortBy, sortDir, pageSize, selectedWarehouseId])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Warehouse Workspace</p>
        <h1 className="text-2xl font-bold">Book Distribution</h1>
        <p className="mt-1 text-slate-500">Track distribution by title, ISBN, and warehouse with sortable, paginated views.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(error)}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Distribution Matrix</h2>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-all duration-150 ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-all duration-150 ${
                viewMode === 'heatmap'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or ISBN"
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="title">Sort: Title</option>
            <option value="author">Sort: Author</option>
            <option value="isbn">Sort: ISBN</option>
            <option value="stock">Sort: Total Stock</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as typeof sortDir)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="asc">Order: Ascending</option>
            <option value="desc">Order: Descending</option>
          </select>
          <select
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
          <div className="rounded-lg border px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {sortedBooks.length} result(s)
          </div>
        </div>

        <div className="mt-4 relative max-h-[560px] overflow-auto rounded-lg border border-slate-200/70 dark:border-slate-700">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[260px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Book</th>
                <th className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Total</th>
                {visibleWarehouses.map((warehouse) => (
                  <th key={warehouse.id} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">{warehouse.code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedBooks.map((book) => (
                <tr key={book.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-xs text-slate-500">{book.author}</p>
                    <p className="text-xs text-slate-400">{book.isbn}</p>
                  </td>
                  <td className="px-3 py-2 font-semibold">{book.stock}</td>
                  {visibleWarehouses.map((warehouse) => {
                    const value = stockDistributionMap[book.id]?.[warehouse.id] ?? 0
                    const intensity = Math.max(0.08, value / maxVisibleStock)
                    return (
                      <td
                        key={`${book.id}:${warehouse.id}`}
                        className={`px-3 py-2 ${viewMode === 'heatmap' ? 'font-semibold' : ''}`}
                        style={viewMode === 'heatmap'
                          ? {
                              background: `linear-gradient(90deg, rgba(59,130,246,${Math.min(intensity, 0.7)}) 0%, rgba(59,130,246,${Math.min(intensity, 0.28)}) 100%)`,
                            }
                          : undefined}
                      >
                        {value}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {!isLoading && books.length === 0 && (
                <tr>
                  <td colSpan={2 + visibleWarehouses.length} className="px-3 py-4 text-slate-500">
                    No distribution data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing {startRow}-{endRow} of {sortedBooks.length} • Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              First
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`rounded border px-3 py-1 text-sm transition-all duration-150 dark:border-slate-700 ${
                  pageNumber === page ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : ''
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminBookDistributionPage
