import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useBook, useBooks } from '@/services/books'
import {
  useBookStockPresence,
  useCompletePurchaseRequest,
  useCreatePurchaseRequest,
  usePurchaseRequests,
  useReviewPurchaseRequest,
  useWarehouseStocks,
  useWarehouses,
  type PurchaseRequestStatus,
} from '@/services/warehouses'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

const statusOptions: PurchaseRequestStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED']

type BatchMode = 'LOW_OR_OUT' | 'OUT_ONLY' | 'ALL' | 'NEW_BOOKS'

type BatchItem = {
  bookId: string
  title: string
  author: string
  isbn: string
  currentStock: number
  threshold: number
  quantity: number
  estimatedCost?: number
}

type BatchCandidate = {
  id: string
  bookId: string
  stock: number
  lowStockThreshold: number
  warehousePresenceCount: number
  book: {
    id: string
    title: string
    author: string
    isbn: string
  }
}

const getStatusTone = (status: PurchaseRequestStatus) => {
  switch (status) {
    case 'COMPLETED':
      return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
    case 'APPROVED':
      return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200'
    case 'PENDING_APPROVAL':
      return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'
    case 'REJECTED':
      return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
    default:
      return 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
  }
}

const AdminPurchaseRequestsPage = () => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'warehouse.purchase_request.create')
  const canApprove = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'finance.purchase_request.approve')
  const canReject = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'finance.purchase_request.reject')
  const canComplete = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'warehouse.purchase_request.complete')

  const [status, setStatus] = useState<PurchaseRequestStatus | ''>('')
  const [warehouseId, setWarehouseId] = useState('')
  const { message, showMessage } = useTimedMessage(3200)

  const [builderWarehouseId, setBuilderWarehouseId] = useState('')
  const [batchMode, setBatchMode] = useState<BatchMode>('LOW_OR_OUT')
  const [batchSearch, setBatchSearch] = useState('')
  const [batchReviewNote, setBatchReviewNote] = useState('')
  const [batchSubmitForApproval, setBatchSubmitForApproval] = useState(true)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [prefillDone, setPrefillDone] = useState(false)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  const { data: warehouses = [] } = useWarehouses()
  const { data: bookStockPresence } = useBookStockPresence()
  const { data: builderStocks = [] } = useWarehouseStocks(builderWarehouseId || undefined)
  const { data: booksData } = useBooks({
    page: 1,
    limit: 100,
    sortBy: 'title',
    sortOrder: 'asc',
    status: 'active',
  })
  const { data: requests = [], error } = usePurchaseRequests({
    status: status || undefined,
    warehouseId: warehouseId || undefined,
  })

  const createMutation = useCreatePurchaseRequest()
  const reviewMutation = useReviewPurchaseRequest()
  const completeMutation = useCompletePurchaseRequest()

  const sorted = useMemo(() => requests, [requests])
  const prefillParams = useMemo(() => {
    const query = new URLSearchParams(location.search)
    return {
      warehouseId: query.get('warehouseId') || '',
      bookId: query.get('bookId') || '',
    }
  }, [location.search])
  const { data: prefillBook } = useBook(prefillParams.bookId)

  const warehouseStockByBookId = useMemo(
    () => new Map(builderStocks.map((row) => [row.bookId, row])),
    [builderStocks],
  )
  const bookPresenceByBookId = useMemo(
    () =>
      new Map((bookStockPresence?.byBook ?? []).map((row) => [row.bookId, row.warehouseCount])),
    [bookStockPresence?.byBook],
  )

  const candidateRows = useMemo<BatchCandidate[]>(() => {
    const books = booksData?.books ?? []
    return books.map((book) => {
      const stockRow = warehouseStockByBookId.get(book.id)
      const warehousePresenceCount = bookPresenceByBookId.get(book.id) ?? 0
      return {
        id: stockRow?.id ?? `${builderWarehouseId || 'warehouse'}-${book.id}`,
        bookId: book.id,
        stock: stockRow?.stock ?? 0,
        lowStockThreshold: stockRow?.lowStockThreshold ?? 5,
        warehousePresenceCount,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        },
      }
    })
  }, [booksData?.books, warehouseStockByBookId, builderWarehouseId, bookPresenceByBookId])

  const candidates = useMemo(() => {
    const keyword = batchSearch.trim().toLowerCase()

    return candidateRows
      .filter((row) => {
        if (batchMode === 'OUT_ONLY') {
          return row.stock === 0
        }
        if (batchMode === 'NEW_BOOKS') {
          return row.warehousePresenceCount === 0
        }
        if (batchMode === 'LOW_OR_OUT') {
          return row.stock <= row.lowStockThreshold
        }
        return true
      })
      .filter((row) => {
        if (!keyword) return true
        return (
          row.book.title.toLowerCase().includes(keyword)
          || row.book.author.toLowerCase().includes(keyword)
          || row.book.isbn.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => a.stock - b.stock)
  }, [candidateRows, batchMode, batchSearch])

  const addToBatch = (row: BatchCandidate) => {
    const defaultQty = Math.max(1, row.lowStockThreshold * 2 - row.stock)

    setBatchItems((prev) => {
      const exists = prev.some((item) => item.bookId === row.bookId)
      if (exists) return prev

      return [
        ...prev,
        {
          bookId: row.bookId,
          title: row.book.title,
          author: row.book.author,
          isbn: row.book.isbn,
          currentStock: row.stock,
          threshold: row.lowStockThreshold,
          quantity: defaultQty,
        },
      ]
    })
  }

  useEffect(() => {
    if (prefillDone) return
    if (!prefillParams.warehouseId) return
    setBuilderWarehouseId(prefillParams.warehouseId)
  }, [prefillDone, prefillParams.warehouseId])

  useEffect(() => {
    if (prefillDone) return
    if (!prefillParams.bookId || !builderWarehouseId) return
    if (builderWarehouseId !== prefillParams.warehouseId) return
    if (!prefillBook) return
    const stockRow = warehouseStockByBookId.get(prefillBook.id)
    addToBatch({
      id: stockRow?.id ?? `${builderWarehouseId}-${prefillBook.id}`,
      bookId: prefillBook.id,
      stock: stockRow?.stock ?? 0,
      lowStockThreshold: stockRow?.lowStockThreshold ?? 5,
      warehousePresenceCount: bookPresenceByBookId.get(prefillBook.id) ?? 0,
      book: {
        id: prefillBook.id,
        title: prefillBook.title,
        author: prefillBook.author,
        isbn: prefillBook.isbn,
      },
    })
    setPrefillDone(true)
  }, [
    prefillDone,
    prefillParams.bookId,
    prefillParams.warehouseId,
    builderWarehouseId,
    prefillBook,
    warehouseStockByBookId,
  ])

  const updateBatchItem = (bookId: string, patch: Partial<BatchItem>) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.bookId === bookId ? { ...item, ...patch } : item)),
    )
  }

  const removeBatchItem = (bookId: string) => {
    setBatchItems((prev) => prev.filter((item) => item.bookId !== bookId))
  }

  const submitBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreate) {
      showMessage('Missing permission: warehouse.purchase_request.create')
      return
    }
    if (!builderWarehouseId) {
      showMessage('Select warehouse first.')
      return
    }
    if (batchItems.length === 0) {
      showMessage('Add at least one book to batch.')
      return
    }

    const invalidQty = batchItems.find((item) => !Number.isInteger(item.quantity) || item.quantity < 1)
    if (invalidQty) {
      showMessage(`Invalid quantity for ${invalidQty.title}. Quantity must be at least 1.`)
      return
    }

    const failed: string[] = []
    let created = 0

    for (const item of batchItems) {
      try {
        await createMutation.mutateAsync({
          bookId: item.bookId,
          warehouseId: builderWarehouseId,
          quantity: item.quantity,
          estimatedCost: item.estimatedCost,
          reviewNote: batchReviewNote || undefined,
          submitForApproval: batchSubmitForApproval,
        })
        created += 1
      } catch {
        failed.push(item.title)
      }
    }

    if (created > 0 && failed.length === 0) {
      setBatchItems([])
      setBatchReviewNote('')
      showMessage(`Created ${created} purchase request(s).`)
      return
    }

    if (created > 0 && failed.length > 0) {
      showMessage(`Created ${created} request(s). Failed: ${failed.join(', ')}`)
      return
    }

    showMessage(`Failed to create requests: ${failed.join(', ')}`)
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Workflow</p>
          <h1 className="text-2xl font-bold">Purchase Requests</h1>
          <p className="mt-1 text-slate-500">Create single or batch purchase requests from low/out-of-stock books per warehouse.</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsBuilderOpen(true)}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            Create Request
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(error)}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Queue Filters</h2>
          <div className="mt-4 grid gap-3">
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PurchaseRequestStatus | '')}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
      </div>

      <AdminSlideOverPanel
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title="Batch Request Builder"
        description="Create single or batch purchase requests from low/out-of-stock books."
        widthClassName="sm:max-w-[56rem]"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="purchase-request-builder-form"
              disabled={createMutation.isPending || !canCreate || !builderWarehouseId || batchItems.length === 0}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {createMutation.isPending ? 'Creating...' : `Create ${batchItems.length || ''} Request(s)`}
            </button>
          </div>
        }
      >
        <form id="purchase-request-builder-form" onSubmit={submitBatchCreate}>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={builderWarehouseId}
              onChange={(e) => {
                setBuilderWarehouseId(e.target.value)
                setBatchItems([])
              }}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <select
              value={batchMode}
              onChange={(e) => setBatchMode(e.target.value as BatchMode)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="LOW_OR_OUT">Low + Out of Stock</option>
              <option value="OUT_ONLY">Out of Stock Only</option>
              <option value="NEW_BOOKS">New Books</option>
              <option value="ALL">All Books in Warehouse</option>
            </select>
            <input
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              placeholder="Search by title, author, ISBN"
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className={`admin-table-wrapper mt-4 max-h-64 overflow-auto ${!builderWarehouseId ? 'opacity-60' : ''}`}>
            <table className="admin-table min-w-full text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-3 py-2 text-left">Book</th>
                  <th className="px-3 py-2 text-left">Current</th>
                  <th className="px-3 py-2 text-left">Threshold</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium">{row.book.title}</p>
                      <p className="text-xs text-slate-500">{row.book.author} • {row.book.isbn}</p>
                    </td>
                    <td className="px-3 py-2">{row.stock}</td>
                    <td className="px-3 py-2">{row.lowStockThreshold}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => addToBatch(row)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
                {builderWarehouseId && candidates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-sm text-slate-500">No matching books for this filter.</td>
                  </tr>
                )}
                {!builderWarehouseId && (
                  <tr>
                    <td colSpan={4} className="px-3 py-7 text-center text-sm text-slate-500">
                      <p className="font-medium">Select a warehouse to begin.</p>
                      <p className="text-xs text-slate-400">Candidate books will appear here for batch request creation.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Batch Cart</h3>
              <p className="text-xs text-slate-500">{batchItems.length} item(s)</p>
            </div>

            <div className="mt-3 space-y-2">
              {batchItems.map((item) => (
                <div key={item.bookId} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_120px_140px_auto] dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">Current {item.currentStock} • threshold {item.threshold}</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateBatchItem(item.bookId, { quantity: Number(e.target.value) || 1 })}
                    className="rounded border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                    title="Quantity"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.estimatedCost ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateBatchItem(item.bookId, { estimatedCost: value === '' ? undefined : Number(value) })
                    }}
                    className="rounded border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Est. cost"
                    title="Estimated cost"
                  />
                  <button
                    type="button"
                    onClick={() => removeBatchItem(item.bookId)}
                    className="rounded border border-rose-200 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-all duration-150 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {batchItems.length === 0 && <p className="text-sm text-slate-500">No books added yet.</p>}
            </div>

            <textarea
              value={batchReviewNote}
              onChange={(e) => setBatchReviewNote(e.target.value)}
              placeholder="Reason / note for finance (optional)"
              rows={2}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={batchSubmitForApproval}
                onChange={(e) => setBatchSubmitForApproval(e.target.checked)}
              />
              Submit for approval now
            </label>
          </div>
        </form>
      </AdminSlideOverPanel>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Queue</h2>
        <div className="admin-table-wrapper mt-4 overflow-auto">
          <table className="admin-table min-w-full text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Book</th>
                <th className="px-3 py-2 text-left">Warehouse</th>
                <th className="px-3 py-2 text-left">Qty</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Requested By</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((request) => (
                <tr key={request.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{request.book.title}</p>
                    <p className="text-xs text-slate-500">{request.book.author}</p>
                  </td>
                  <td className="px-3 py-2">{request.warehouse.code}</td>
                  <td className="px-3 py-2">{request.quantity}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusTone(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{request.requestedByUser.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {request.status === 'PENDING_APPROVAL' && canApprove && (
                        <button
                          type="button"
                          onClick={() => void reviewMutation.mutateAsync({ id: request.id, action: 'APPROVE' })}
                          className="rounded border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 transition-all duration-150 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          Approve
                        </button>
                      )}
                      {request.status === 'PENDING_APPROVAL' && canReject && (
                        <button
                          type="button"
                          onClick={() => void reviewMutation.mutateAsync({ id: request.id, action: 'REJECT' })}
                          className="rounded border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 transition-all duration-150 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Reject
                        </button>
                      )}
                      {request.status === 'APPROVED' && canComplete && (
                        <button
                          type="button"
                          onClick={() => void completeMutation.mutateAsync(request.id)}
                          className="rounded border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700 transition-all duration-150 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>No purchase requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminPurchaseRequestsPage
