import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import { useBooks } from '@/services/books'
import { useWarehouses } from '@/services/warehouses'
import {
  useCreateStore,
  useDeleteStore,
  usePermanentDeleteStore,
  useRestoreStore,
  useStoreSalesOverview,
  useStoreTransfers,
  useStores,
  useTransferToStore,
  useUpdateStore,
  type Store,
} from '@/services/stores'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

const emptyStore = {
  name: '',
  code: '',
  city: '',
  state: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
}

const emptyTransferLine = {
  bookId: '',
  quantity: '1',
}

type TransferLine = {
  bookId: string
  quantity: number
}

type TransferDraftStatus = 'DRAFT' | 'SUBMITTED' | 'EXECUTED'

type TransferDraft = {
  id: string
  fromWarehouseId: string
  toStoreId: string
  note?: string
  lines: TransferLine[]
  status: TransferDraftStatus
  createdAt: string
}

const STORE_TRANSFER_DRAFTS_KEY = 'store-transfer-drafts-v1'

const AdminStoresPage = () => {
  const { data: stores = [] } = useStores('active')
  const { data: warehouses = [] } = useWarehouses()
  const { data: booksData } = useBooks({ page: 1, limit: 100, status: 'active' })
  const { data: transfers = [] } = useStoreTransfers(40)
  const { data: salesOverview } = useStoreSalesOverview()

  const createStore = useCreateStore()
  const updateStore = useUpdateStore()
  const deleteStore = useDeleteStore()
  const restoreStore = useRestoreStore()
  const permanentDeleteStore = usePermanentDeleteStore()
  const transferToStore = useTransferToStore()

  const books = booksData?.books ?? []

  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [isStorePanelOpen, setIsStorePanelOpen] = useState(false)
  const [isTransferPanelOpen, setIsTransferPanelOpen] = useState(false)
  const [storeForm, setStoreForm] = useState(emptyStore)
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toStoreId: '',
    note: '',
    lines: [{ ...emptyTransferLine }],
  })
  const [transferDrafts, setTransferDrafts] = useState<TransferDraft[]>([])

  const { message, showMessage } = useTimedMessage(2400)

  const selectedEditingStore = useMemo(
    () => stores.find((store) => store.id === editingStoreId) ?? null,
    [editingStoreId, stores],
  )

  const topStores = useMemo(
    () => (salesOverview?.perStore ?? []).slice(0, 5),
    [salesOverview],
  )

  const warehouseMap = useMemo(
    () => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])),
    [warehouses],
  )
  const storeMap = useMemo(
    () => new Map(stores.map((store) => [store.id, store])),
    [stores],
  )
  const bookMap = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  )

  const draftQueue = useMemo(
    () => transferDrafts.filter((item) => item.status !== 'EXECUTED'),
    [transferDrafts],
  )

  const completedDrafts = useMemo(
    () => transferDrafts.filter((item) => item.status === 'EXECUTED'),
    [transferDrafts],
  )

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_TRANSFER_DRAFTS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as TransferDraft[]
      if (Array.isArray(parsed)) {
        setTransferDrafts(parsed)
      }
    } catch {
      setTransferDrafts([])
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORE_TRANSFER_DRAFTS_KEY, JSON.stringify(transferDrafts))
  }, [transferDrafts])

  const syncFormFromStore = (store: Store) => {
    setStoreForm({
      name: store.name,
      code: store.code,
      city: store.city,
      state: store.state,
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      isActive: store.isActive,
    })
  }

  const closeStorePanel = () => {
    setIsStorePanelOpen(false)
    setEditingStoreId(null)
    setStoreForm(emptyStore)
  }

  const closeTransferPanel = () => {
    setIsTransferPanelOpen(false)
    setTransferForm({
      fromWarehouseId: '',
      toStoreId: '',
      note: '',
      lines: [{ ...emptyTransferLine }],
    })
  }

  const validateTransferLines = () => {
    if (!transferForm.fromWarehouseId || !transferForm.toStoreId) {
      throw new Error('Warehouse and store are required for transfer.')
    }

    const validLines = transferForm.lines.filter((line) => line.bookId)
    if (validLines.length === 0) {
      throw new Error('Add at least one book to transfer.')
    }

    const normalizedLines: TransferLine[] = validLines.map((line) => {
      const quantity = Number(line.quantity)
      if (Number.isNaN(quantity) || quantity < 1) {
        throw new Error('Each transfer quantity must be at least 1.')
      }
      return { bookId: line.bookId, quantity }
    })

    return normalizedLines
  }

  const saveDraft = async (status: TransferDraftStatus) => {
    try {
      const normalizedLines = validateTransferLines()
      const draft: TransferDraft = {
        id: crypto.randomUUID(),
        fromWarehouseId: transferForm.fromWarehouseId,
        toStoreId: transferForm.toStoreId,
        note: transferForm.note || undefined,
        lines: normalizedLines,
        status,
        createdAt: new Date().toISOString(),
      }
      setTransferDrafts((prev) => [draft, ...prev])
      closeTransferPanel()
      showMessage(status === 'DRAFT' ? 'Transfer draft saved.' : 'Transfer submitted to delivery queue.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const executeTransferDraft = async (draftId: string) => {
    const draft = transferDrafts.find((item) => item.id === draftId)
    if (!draft) return

    try {
      for (const line of draft.lines) {
        await transferToStore.mutateAsync({
          fromWarehouseId: draft.fromWarehouseId,
          toStoreId: draft.toStoreId,
          bookId: line.bookId,
          quantity: line.quantity,
          note: draft.note,
        })
      }
      setTransferDrafts((prev) =>
        prev.map((item) =>
          item.id === draftId
            ? { ...item, status: 'EXECUTED' }
            : item,
        ),
      )
      showMessage(`Delivery completed transfer (${draft.lines.length} item${draft.lines.length > 1 ? 's' : ''}).`)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const removeTransferDraft = (draftId: string) => {
    setTransferDrafts((prev) => prev.filter((item) => item.id !== draftId))
  }

  const formatDraftRoute = (draft: TransferDraft) => {
    const from = warehouseMap.get(draft.fromWarehouseId)
    const to = storeMap.get(draft.toStoreId)
    return `${from?.code || 'Unknown WH'} -> ${to?.code || 'Unknown Store'}`
  }

  const formatDraftLine = (line: TransferLine) => {
    const book = bookMap.get(line.bookId)
    return `${book?.title || 'Unknown book'} x ${line.quantity}`
  }

  const onCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeForm.name || !storeForm.code || !storeForm.city || !storeForm.state) {
      showMessage('Name, code, city, and state are required.')
      return
    }

    try {
      await createStore.mutateAsync({
        ...storeForm,
        address: storeForm.address || undefined,
        phone: storeForm.phone || undefined,
        email: storeForm.email || undefined,
      })
      showMessage('Store created.')
      closeStorePanel()
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStoreId) {
      showMessage('Select a store from the list first.')
      return
    }

    try {
      await updateStore.mutateAsync({
        id: editingStoreId,
        data: {
          ...storeForm,
          address: storeForm.address || '',
          phone: storeForm.phone || '',
          email: storeForm.email || '',
        },
      })
      showMessage('Store updated.')
      closeStorePanel()
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onDeleteStore = async (storeId: string) => {
    const store = stores.find((item) => item.id === storeId)
    const confirmed = window.confirm(
      `Move store "${store?.name || 'this store'}" to bin? You can restore it later.`,
    )
    if (!confirmed) return

    try {
      await deleteStore.mutateAsync(storeId)
      if (editingStoreId === storeId) {
        closeStorePanel()
      }
      showMessage('Store moved to bin.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onRestoreStore = async (storeId: string) => {
    try {
      await restoreStore.mutateAsync(storeId)
      showMessage('Store restored from bin.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onPermanentDeleteStore = async (storeId: string) => {
    const store = stores.find((item) => item.id === storeId)
    const confirmed = window.confirm(
      `Permanently delete "${store?.name || 'this store'}"? This cannot be undone.`,
    )
    if (!confirmed) return
    try {
      await permanentDeleteStore.mutateAsync(storeId)
      showMessage('Store permanently deleted.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveDraft('SUBMITTED')
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Operations</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Physical Stores</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingStoreId(null)
                setStoreForm(emptyStore)
                setIsStorePanelOpen(true)
              }}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              New Store
            </button>
            <button
              type="button"
              onClick={() => setIsTransferPanelOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowRightLeft className="h-4 w-4" />
              New Transfer
            </button>
            <Link
              to="/admin/bin"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Open bin"
            >
              <Trash2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <p className="mt-2 text-slate-500">Manage store branches, transfer stock from warehouses, and monitor store pickup sales.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Stores" value={salesOverview?.totals.stores ?? stores.length} />
        <MetricCard label="Active Stores" value={salesOverview?.totals.activeStores ?? stores.filter((store) => store.isActive).length} />
        <MetricCard label="Pickup Orders" value={salesOverview?.totals.orders ?? 0} />
        <MetricCard label="Store Sales" value={`$${(salesOverview?.totals.grossSales ?? 0).toFixed(2)}`} />
        <MetricCard label="Avg Order" value={`$${(salesOverview?.totals.avgOrderValue ?? 0).toFixed(2)}`} />
      </section>

      <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Store Branches</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Code</th>
                <th className="px-2 py-2">Location</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2 font-medium">{store.name}</td>
                  <td className="px-2 py-2 font-mono text-xs">{store.code}</td>
                  <td className="px-2 py-2">{store.city}, {store.state}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${store.deletedAt ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : store.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                      {store.deletedAt ? 'In Bin' : store.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {!store.deletedAt ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStoreId(store.id)
                              syncFormFromStore(store)
                              setIsStorePanelOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs dark:border-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStore(store.id)}
                            className="inline-flex items-center gap-1 rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 dark:border-rose-800 dark:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Move To Bin
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onRestoreStore(store.id)}
                            className="inline-flex items-center gap-1 rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => onPermanentDeleteStore(store.id)}
                            className="inline-flex items-center gap-1 rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 dark:border-rose-800 dark:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Permanently
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Delivery Queue (Transfer Drafts)</h2>
        <div className="mt-4 space-y-3">
          {draftQueue.map((draft) => (
            <div key={draft.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{formatDraftRoute(draft)}</p>
                  <p className="text-xs text-slate-500">{new Date(draft.createdAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  draft.status === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}>
                  {draft.status}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {draft.lines.map((line, index) => (
                  <p key={`${draft.id}-line-${index}`}>{formatDraftLine(line)}</p>
                ))}
                {draft.note ? <p className="text-slate-500">Note: {draft.note}</p> : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={draft.status !== 'SUBMITTED' || transferToStore.isPending}
                  onClick={() => void executeTransferDraft(draft.id)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
                >
                  Execute Delivery
                </button>
                <button
                  type="button"
                  onClick={() => removeTransferDraft(draft.id)}
                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-rose-700 dark:border-rose-800 dark:text-rose-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {draftQueue.length === 0 ? (
            <p className="text-sm text-slate-500">No pending transfer drafts.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Recent Transfers</h2>
        <div className="mt-4 max-h-72 space-y-2 overflow-auto">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-semibold">{transfer.book.title}</p>
              <p className="text-xs text-slate-500">{transfer.fromWarehouse.name} {'->'} {transfer.toStore.name}</p>
              <p className="text-xs text-slate-500">Qty {transfer.quantity} - {new Date(transfer.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {transfers.length === 0 && <p className="text-sm text-slate-500">No transfers yet.</p>}
        </div>
      </section>

      {completedDrafts.length > 0 ? (
        <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Completed Drafts</h2>
          <div className="mt-3 grid gap-2">
            {completedDrafts.slice(0, 6).map((draft) => (
              <div key={draft.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
                <p className="font-semibold">{formatDraftRoute(draft)}</p>
                <p className="text-slate-500">{new Date(draft.createdAt).toLocaleString()} - {draft.lines.length} line(s)</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Store Sales Ranking</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-2 py-2">Store</th>
                <th className="px-2 py-2">Orders</th>
                <th className="px-2 py-2">Units</th>
                <th className="px-2 py-2">Sales</th>
                <th className="px-2 py-2">Top Book</th>
              </tr>
            </thead>
            <tbody>
              {topStores.map((entry) => (
                <tr key={entry.store.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2">{entry.store.name}</td>
                  <td className="px-2 py-2">{entry.totalOrders}</td>
                  <td className="px-2 py-2">{entry.unitsSold}</td>
                  <td className="px-2 py-2">${entry.grossSales.toFixed(2)}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{entry.topBooks[0]?.title || '-'}</td>
                </tr>
              ))}
              {topStores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-sm text-slate-500">No store pickup sales yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminSlideOverPanel
        open={isStorePanelOpen}
        onClose={closeStorePanel}
        kicker="Operations"
        title={selectedEditingStore ? 'Edit Store' : 'Create Store'}
        description="Configure store identity, location, and active status."
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeStorePanel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="store-form"
              disabled={createStore.isPending || updateStore.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900"
            >
              {selectedEditingStore ? 'Save Changes' : 'Create Store'}
            </button>
          </div>
        )}
      >
        <form id="store-form" className="space-y-3" onSubmit={selectedEditingStore ? onUpdateStore : onCreateStore}>
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Store name" value={storeForm.name} onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Store code" value={storeForm.code} onChange={(e) => setStoreForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="City" value={storeForm.city} onChange={(e) => setStoreForm((prev) => ({ ...prev, city: e.target.value }))} />
            <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="State" value={storeForm.state} onChange={(e) => setStoreForm((prev) => ({ ...prev, state: e.target.value }))} />
          </div>
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Address" value={storeForm.address} onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))} />
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Phone" value={storeForm.phone} onChange={(e) => setStoreForm((prev) => ({ ...prev, phone: e.target.value }))} />
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Email" value={storeForm.email} onChange={(e) => setStoreForm((prev) => ({ ...prev, email: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={storeForm.isActive} onChange={(e) => setStoreForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
            Active store
          </label>
        </form>
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={isTransferPanelOpen}
        onClose={closeTransferPanel}
        kicker="Operations"
        title="Warehouse to Store Transfer"
        description="Create one transfer request with multiple books."
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void saveDraft('DRAFT')}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={closeTransferPanel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="transfer-form"
              disabled={transferToStore.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900"
            >
              Submit to Delivery
            </button>
          </div>
        )}
      >
        <form id="transfer-form" className="space-y-3" onSubmit={onTransfer}>
          <select
            value={transferForm.fromWarehouseId}
            onChange={(e) => setTransferForm((prev) => ({ ...prev, fromWarehouseId: e.target.value }))}
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Source warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
          <select
            value={transferForm.toStoreId}
            onChange={(e) => setTransferForm((prev) => ({ ...prev, toStoreId: e.target.value }))}
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Destination store</option>
            {stores.filter((store) => store.isActive).map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.code})
              </option>
            ))}
          </select>

          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            {transferForm.lines.map((line, index) => (
              <div key={`${index}-${line.bookId}`} className="grid grid-cols-[1fr_120px_auto] items-center gap-2">
                <select
                  value={line.bookId}
                  onChange={(e) => setTransferForm((prev) => ({
                    ...prev,
                    lines: prev.lines.map((row, rowIndex) => (
                      rowIndex === index ? { ...row, bookId: e.target.value } : row
                    )),
                  }))}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Book</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
                <input
                  value={line.quantity}
                  onChange={(e) => setTransferForm((prev) => ({
                    ...prev,
                    lines: prev.lines.map((row, rowIndex) => (
                      rowIndex === index ? { ...row, quantity: e.target.value } : row
                    )),
                  }))}
                  type="number"
                  min={1}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Qty"
                />
                <button
                  type="button"
                  onClick={() => setTransferForm((prev) => ({
                    ...prev,
                    lines: prev.lines.length > 1
                      ? prev.lines.filter((_, rowIndex) => rowIndex !== index)
                      : prev.lines,
                  }))}
                  disabled={transferForm.lines.length <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300 text-rose-700 disabled:opacity-40 dark:border-rose-800 dark:text-rose-300"
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTransferForm((prev) => ({
                ...prev,
                lines: [...prev.lines, { ...emptyTransferLine }],
              }))}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              <Plus className="h-4 w-4" />
              Add Book
            </button>
          </div>

          <textarea
            value={transferForm.note}
            onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Transfer note (optional)"
          />
        </form>
      </AdminSlideOverPanel>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number | string
}

const MetricCard = ({ label, value }: MetricCardProps) => (
  <div className="rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
)

export default AdminStoresPage
