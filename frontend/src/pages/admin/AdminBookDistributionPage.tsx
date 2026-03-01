import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWarehouses } from '@/services/warehouses'
import { useStores } from '@/services/stores'
import { api, getErrorMessage } from '@/lib/api'

type ViewMode = 'table' | 'heatmap'

type LocationType = 'warehouse' | 'store'

type LocationCell = {
  id: string
  code: string
  name: string
  type: LocationType
  mapKey: string
}

const AdminBookDistributionPage = () => {
  const [search, setSearch] = useState('')
  const [selectedLocationKey, setSelectedLocationKey] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'isbn' | 'stock'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const { data: warehouses = [] } = useWarehouses()
  const { data: stores = [] } = useStores()
  const {
    data: books = [],
    error: booksError,
    isLoading: isBooksLoading,
  } = useQuery({
    queryKey: ['book-distribution-books'],
    queryFn: async () => {
      const limit = 100
      let page = 1
      let total = Number.POSITIVE_INFINITY
      const allBooks: Array<{
        id: string
        title: string
        author: string
        isbn: string
      }> = []

      while (allBooks.length < total) {
        const response = await api.get('/books', {
          params: {
            status: 'active',
            page,
            limit,
          },
        })
        const payload = response.data as {
          books: Array<{
            id: string
            title: string
            author: string
            isbn: string
          }>
          total: number
        }

        if (!Array.isArray(payload.books) || payload.books.length === 0) {
          break
        }

        allBooks.push(...payload.books)
        total = Number.isFinite(payload.total) ? payload.total : allBooks.length
        page += 1
      }

      return allBooks
    },
  })

  const locations = useMemo<LocationCell[]>(
    () => [
      ...warehouses.map((warehouse) => ({
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        type: 'warehouse' as const,
        mapKey: `warehouse:${warehouse.id}`,
      })),
      ...stores.map((store) => ({
        id: store.id,
        code: store.code,
        name: store.name,
        type: 'store' as const,
        mapKey: `store:${store.id}`,
      })),
    ],
    [stores, warehouses],
  )

  const {
    data: stockDistributionMap = {},
    error: distributionError,
    isLoading: isDistributionLoading,
  } = useQuery({
    queryKey: [
      'book-distribution',
      warehouses.map((w) => w.id).join(','),
      stores.map((s) => s.id).join(','),
    ],
    queryFn: async (): Promise<Record<string, Record<string, number>>> => {
      const [warehouseResponses, storeResponses] = await Promise.all([
        Promise.all(
          warehouses.map(async (warehouse) => {
            const response = await api.get(`/warehouses/${warehouse.id}/stocks`)
            return {
              mapKey: `warehouse:${warehouse.id}`,
              rows: response.data as Array<{ bookId: string; stock: number }>,
            }
          }),
        ),
        Promise.all(
          stores.map(async (store) => {
            const response = await api.get(`/stores/${store.id}/stocks`)
            return {
              mapKey: `store:${store.id}`,
              rows: response.data as Array<{ bookId: string; stock: number }>,
            }
          }),
        ),
      ])

      const distribution: Record<string, Record<string, number>> = {}
      for (const result of [...warehouseResponses, ...storeResponses]) {
        for (const row of result.rows) {
          if (!distribution[row.bookId]) distribution[row.bookId] = {}
          distribution[row.bookId][result.mapKey] = row.stock
        }
      }
      return distribution
    },
    enabled: warehouses.length + stores.length > 0,
    retry: false,
  })

  const visibleLocations = useMemo(() => {
    if (!selectedLocationKey) return locations
    return locations.filter((location) => location.mapKey === selectedLocationKey)
  }, [locations, selectedLocationKey])

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
        case 'stock': {
          const aTotal = locations.reduce((sum, location) => sum + (stockDistributionMap[a.id]?.[location.mapKey] ?? 0), 0)
          const bTotal = locations.reduce((sum, location) => sum + (stockDistributionMap[b.id]?.[location.mapKey] ?? 0), 0)
          return (aTotal - bTotal) * direction
        }
        default:
          return a.title.localeCompare(b.title) * direction
      }
    })
  }, [filteredBooks, locations, sortBy, sortDir, stockDistributionMap])

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
      visibleLocations.map((location) => stockDistributionMap[book.id]?.[location.mapKey] ?? 0),
    )
    return Math.max(1, ...values)
  }, [pagedBooks, visibleLocations, stockDistributionMap])

  useEffect(() => {
    setPage(1)
  }, [search, sortBy, sortDir, pageSize, selectedLocationKey])

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
        <p className="mt-1 text-slate-500">Track stock across warehouses and stores with sortable, paginated matrix views.</p>
      </div>

      {(booksError || distributionError) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {booksError
            ? `Books query failed: ${getErrorMessage(booksError)}`
            : `Distribution query failed: ${getErrorMessage(distributionError)}`}
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
            className="h-11 w-full rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={selectedLocationKey}
            onChange={(e) => setSelectedLocationKey(e.target.value)}
            className="h-11 rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={location.mapKey} value={location.mapKey}>
                {location.type === 'warehouse' ? 'WH' : 'Store'} • {location.name} ({location.code})
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
            <option value="stock">Sort: Network Stock</option>
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

        <div className="admin-table-wrapper relative mt-4 max-h-[560px] overflow-auto">
          <table className="admin-table min-w-full border-separate border-spacing-0 text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[260px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Book</th>
                <th className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Network Total</th>
                {visibleLocations.map((location) => (
                  <th key={location.mapKey} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">
                    {location.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedBooks.map((book) => {
                const networkTotal = locations.reduce(
                  (sum, location) => sum + (stockDistributionMap[book.id]?.[location.mapKey] ?? 0),
                  0,
                )

                return (
                  <tr key={book.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-slate-500">{book.author}</p>
                      <p className="text-xs text-slate-400">{book.isbn}</p>
                    </td>
                    <td className="px-3 py-2 font-semibold">{networkTotal}</td>
                    {visibleLocations.map((location) => {
                      const value = stockDistributionMap[book.id]?.[location.mapKey] ?? 0
                      const intensity = Math.max(0.08, value / maxVisibleStock)
                      return (
                        <td
                          key={`${book.id}:${location.mapKey}`}
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
                )
              })}
              {!isBooksLoading && !isDistributionLoading && sortedBooks.length === 0 && (
                <tr>
                  <td colSpan={2 + visibleLocations.length} className="px-3 py-4 text-slate-500">
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
