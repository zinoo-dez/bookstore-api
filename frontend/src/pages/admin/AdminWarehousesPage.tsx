import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBooks } from '@/services/books'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useSetWarehouseStock,
  useTransferWarehouseStock,
  useWarehouseAlerts,
  useWarehouseTransfers,
  useWarehouseStocks,
  useUpdateWarehouse,
  useWarehouses,
  type WarehouseAlertStatus,
} from '@/services/warehouses'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

type WarehouseActionTab = 'stock' | 'transfer' | 'history' | 'settings'

const AdminWarehousesPage = () => {
  const user = useAuthStore((state) => state.user)
  const canUpdateWarehouseStock =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.stock.update')
  const canManageWarehouseEntity = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const canTransferWarehouse =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.transfer')
  const isWarehouseFocusedUser =
    user?.role === 'USER'
    && hasPermission(user?.permissions, 'warehouse.view')
    && (hasPermission(user?.permissions, 'warehouse.stock.update') || hasPermission(user?.permissions, 'warehouse.transfer'))
    && !hasPermission(user?.permissions, 'finance.reports.view')
    && !hasPermission(user?.permissions, 'staff.view')

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<WarehouseActionTab>('stock')
  const { message, showMessage } = useTimedMessage(2400)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [alertStatus, setAlertStatus] = useState<WarehouseAlertStatus>('OPEN')

  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
  })

  const [stockBookSearch, setStockBookSearch] = useState('')
  const [transferBookSearch, setTransferBookSearch] = useState('')

  const [stockForm, setStockForm] = useState({
    bookId: '',
    stock: '0',
    lowStockThreshold: '5',
  })

  const [transferForm, setTransferForm] = useState({
    bookId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '1',
    note: '',
  })

  const [warehouseEdit, setWarehouseEdit] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
    isActive: true,
  })

  const { data: warehouses = [], isLoading } = useWarehouses()
  const { data: stockSearchResults } = useBooks({ page: 1, limit: 50, title: stockBookSearch || undefined, status: 'active' })
  const { data: transferSearchResults } = useBooks({ page: 1, limit: 50, title: transferBookSearch || undefined, status: 'active' })
  const { data: stocks = [] } = useWarehouseStocks(selectedWarehouseId || undefined)
  const { data: alerts = [] } = useWarehouseAlerts(alertStatus)
  const { data: transfers = [] } = useWarehouseTransfers(50)

  const createWarehouse = useCreateWarehouse()
  const deleteWarehouse = useDeleteWarehouse()
  const updateWarehouse = useUpdateWarehouse()
  const setStock = useSetWarehouseStock()
  const transferStock = useTransferWarehouseStock()
  const selectedWarehousePanelRef = useRef<HTMLDivElement | null>(null)

  const selectedWarehouse = useMemo(
    () => warehouses.find((w) => w.id === selectedWarehouseId),
    [warehouses, selectedWarehouseId],
  )
  const warehouseAlertStats = useMemo(() => {
    const stats = new Map<string, { critical: number; low: number }>()
    alerts.forEach((alert) => {
      const current = stats.get(alert.warehouseId) ?? { critical: 0, low: 0 }
      if (alert.stock === 0) current.critical += 1
      else current.low += 1
      stats.set(alert.warehouseId, current)
    })
    return stats
  }, [alerts])
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const aRank = a.stock <= 0 ? 3 : a.stock <= Math.ceil(a.threshold * 0.5) ? 2 : 1
      const bRank = b.stock <= 0 ? 3 : b.stock <= Math.ceil(b.threshold * 0.5) ? 2 : 1
      if (aRank !== bRank) return bRank - aRank
      return a.stock - b.stock
    })
  }, [alerts])

  const filteredTransfers = useMemo(
    () => transfers.filter((transfer) =>
      transfer.fromWarehouseId === selectedWarehouseId
      || transfer.toWarehouseId === selectedWarehouseId,
    ),
    [transfers, selectedWarehouseId],
  )

  const stockBookOptions = stockSearchResults?.books ?? []
  const transferBookOptions = transferSearchResults?.books ?? []

  const selectedStockBook = useMemo(
    () => stockBookOptions.find((book) => book.id === stockForm.bookId),
    [stockBookOptions, stockForm.bookId],
  )
  const selectedTransferBook = useMemo(
    () => transferBookOptions.find((book) => book.id === transferForm.bookId),
    [transferBookOptions, transferForm.bookId],
  )
  const selectedStockRow = useMemo(
    () => stocks.find((row) => row.bookId === stockForm.bookId),
    [stocks, stockForm.bookId],
  )

  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id)
      setTransferForm((prev) => ({ ...prev, fromWarehouseId: warehouses[0].id }))
    }
  }, [selectedWarehouseId, warehouses])

  useEffect(() => {
    if (!selectedWarehouse) {
      setWarehouseEdit({
        name: '',
        code: '',
        city: '',
        state: '',
        address: '',
        isActive: true,
      })
      return
    }

    setWarehouseEdit({
      name: selectedWarehouse.name,
      code: selectedWarehouse.code,
      city: selectedWarehouse.city,
      state: selectedWarehouse.state,
      address: selectedWarehouse.address || '',
      isActive: selectedWarehouse.isActive,
    })
    setTransferForm((prev) => ({ ...prev, fromWarehouseId: selectedWarehouse.id }))
  }, [selectedWarehouse])

  const getAlertSeverity = (stock: number, threshold: number) => {
    if (stock <= 0) return { label: 'CRITICAL', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' }
    if (stock <= Math.ceil(threshold * 0.5)) return { label: 'HIGH', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' }
    return { label: 'MEDIUM', dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' }
  }

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageWarehouseEntity) return

    if (!newWarehouse.name || !newWarehouse.code || !newWarehouse.city || !newWarehouse.state) {
      showMessage('Name, code, city, and state are required.')
      return
    }

    try {
      await createWarehouse.mutateAsync({
        ...newWarehouse,
        address: newWarehouse.address || undefined,
      })
      setNewWarehouse({ name: '', code: '', city: '', state: '', address: '' })
      setIsCreatePanelOpen(false)
      showMessage('Warehouse created.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (!canManageWarehouseEntity) return

    try {
      await deleteWarehouse.mutateAsync(warehouseId)
      if (selectedWarehouseId === warehouseId) {
        setSelectedWarehouseId('')
      }
      showMessage('Warehouse deleted.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageWarehouseEntity || !selectedWarehouseId) return

    if (!warehouseEdit.name || !warehouseEdit.code || !warehouseEdit.city || !warehouseEdit.state) {
      showMessage('Name, code, city, and state are required.')
      return
    }

    try {
      await updateWarehouse.mutateAsync({
        id: selectedWarehouseId,
        data: {
          name: warehouseEdit.name,
          code: warehouseEdit.code,
          city: warehouseEdit.city,
          state: warehouseEdit.state,
          address: warehouseEdit.address || '',
          isActive: warehouseEdit.isActive,
        },
      })
      showMessage('Warehouse updated.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const chooseStockBook = (bookId: string, label: string) => {
    setStockForm((prev) => ({ ...prev, bookId }))
    setStockBookSearch(label)
    const existing = stocks.find((row) => row.bookId === bookId)
    if (existing) {
      setStockForm((prev) => ({
        ...prev,
        stock: String(existing.stock),
        lowStockThreshold: String(existing.lowStockThreshold),
      }))
    }
  }

  const chooseTransferBook = (bookId: string, label: string) => {
    setTransferForm((prev) => ({ ...prev, bookId }))
    setTransferBookSearch(label)
  }

  const focusAlertInStockPanel = (alert: {
    warehouseId: string
    bookId: string
    stock: number
    threshold: number
    book: { title: string }
  }) => {
    setSelectedWarehouseId(alert.warehouseId)
    setActiveTab('stock')
    setStockBookSearch(alert.book.title)
    setStockForm((prev) => ({
      ...prev,
      bookId: alert.bookId,
      stock: String(alert.stock),
      lowStockThreshold: String(alert.threshold),
    }))
    requestAnimationFrame(() => {
      selectedWarehousePanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const handleSetStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUpdateWarehouseStock) return

    if (!selectedWarehouseId || !stockForm.bookId) {
      showMessage('Select warehouse and book first.')
      return
    }

    const stock = Number(stockForm.stock)
    const lowStockThreshold = Number(stockForm.lowStockThreshold)

    if (Number.isNaN(stock) || stock < 0) {
      showMessage('Stock must be a valid non-negative number.')
      return
    }
    if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 1) {
      showMessage('Low-stock threshold must be at least 1.')
      return
    }
    if (selectedStockRow && selectedStockRow.stock === stock && selectedStockRow.lowStockThreshold === lowStockThreshold) {
      showMessage('No changes detected. Update quantity or threshold first.')
      return
    }

    try {
      const previousStock = selectedStockRow?.stock
      const previousThreshold = selectedStockRow?.lowStockThreshold
      await setStock.mutateAsync({
        warehouseId: selectedWarehouseId,
        bookId: stockForm.bookId,
        stock,
        lowStockThreshold,
      })
      if (previousStock === undefined || previousThreshold === undefined) {
        showMessage(`Stock row created: stock ${stock}, threshold ${lowStockThreshold}.`)
      } else {
        showMessage(`Saved: stock ${previousStock} -> ${stock}, threshold ${previousThreshold} -> ${lowStockThreshold}.`)
      }
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canTransferWarehouse) return

    const quantity = Number(transferForm.quantity)
    if (!transferForm.bookId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
      showMessage('Book and both warehouses are required.')
      return
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      showMessage('Source and destination must be different.')
      return
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      showMessage('Quantity must be at least 1.')
      return
    }

    try {
      await transferStock.mutateAsync({
        bookId: transferForm.bookId,
        fromWarehouseId: transferForm.fromWarehouseId,
        toWarehouseId: transferForm.toWarehouseId,
        quantity,
        note: transferForm.note || undefined,
      })
      showMessage('Transfer created.')
      setTransferForm((prev) => ({ ...prev, quantity: '1', note: '' }))
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const actionTabs: Array<{ key: WarehouseActionTab; label: string; visible: boolean }> = [
    { key: 'stock', label: 'Stock Adjustment', visible: canUpdateWarehouseStock },
    { key: 'transfer', label: 'Transfer Stock', visible: canTransferWarehouse },
    { key: 'history', label: 'Transfer History', visible: true },
    { key: 'settings', label: 'Warehouse Details', visible: canManageWarehouseEntity },
  ]

  return (
    <div className="surface-canvas min-h-screen space-y-6 p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">
            {isWarehouseFocusedUser ? 'Warehouse Workspace' : 'Admin'}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Warehouse Management</h1>
          <p className="mt-1 text-slate-500">Operational workspace for stock, transfers, and low-stock handling.</p>
        </div>
        {canManageWarehouseEntity && (
          <button
            type="button"
            onClick={() => setIsCreatePanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            <Plus className="h-4 w-4" />
            Create Warehouse
          </button>
        )}
      </div>

      {message && (
        <div className="surface-subtle px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          {message}
        </div>
      )}

      <div className="surface-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Low Stock Alerts</h2>
            <select
              value={alertStatus}
              onChange={(e) => setAlertStatus(e.target.value as WarehouseAlertStatus)}
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:border-slate-700 dark:bg-slate-900/70"
            >
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div className="surface-subtle mt-4 max-h-64 overflow-auto bg-slate-50/40 dark:bg-slate-950/30">
            {alerts.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">No alerts in this status.</p>}
            {sortedAlerts.map((alert) => {
              const severity = getAlertSeverity(alert.stock, alert.threshold)
              return (
                <div
                  key={alert.id}
                  className="w-full border-b border-slate-200/60 px-3 py-2 text-left text-sm last:border-b-0 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{alert.book.title}</p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest ${severity.text}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${severity.dot}`} />
                      {severity.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {alert.warehouse.code} • stock {alert.stock} / threshold {alert.threshold}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => focusAlertInStockPanel(alert)}
                      disabled={!canUpdateWarehouseStock}
                      className="rounded border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Adjust Stock
                    </button>
                    <Link
                      to={`/admin/purchase-requests?warehouseId=${alert.warehouseId}&bookId=${alert.bookId}`}
                      className="rounded border border-blue-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/40"
                    >
                      Create Request
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
      </div>

      <AdminSlideOverPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="Warehouse"
        title="Create Warehouse"
        description="Add a new warehouse location for stock and transfer operations."
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-warehouse-form"
              disabled={createWarehouse.isPending}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {createWarehouse.isPending ? 'Creating...' : 'Create Warehouse'}
            </button>
          </div>
        )}
      >
        <form
          id="create-warehouse-form"
          onSubmit={handleCreateWarehouse}
          className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45"
        >
          <input
            placeholder="Name"
            value={newWarehouse.name}
            onChange={(e) => setNewWarehouse((prev) => ({ ...prev, name: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            placeholder="Code"
            value={newWarehouse.code}
            onChange={(e) => setNewWarehouse((prev) => ({ ...prev, code: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            placeholder="City"
            value={newWarehouse.city}
            onChange={(e) => setNewWarehouse((prev) => ({ ...prev, city: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            placeholder="State"
            value={newWarehouse.state}
            onChange={(e) => setNewWarehouse((prev) => ({ ...prev, state: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            placeholder="Address (optional)"
            value={newWarehouse.address}
            onChange={(e) => setNewWarehouse((prev) => ({ ...prev, address: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </form>
      </AdminSlideOverPanel>

      <div className="surface-panel p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">Warehouses</h2>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading warehouses...</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warehouses.map((warehouse) => (
              <button
                key={warehouse.id}
                type="button"
                onClick={() => setSelectedWarehouseId(warehouse.id)}
                className={`surface-card p-3 text-left ${
                  selectedWarehouseId === warehouse.id
                    ? 'border-amber-300 bg-amber-50/75 dark:border-amber-500/70 dark:bg-amber-900/20'
                    : ''
                }`}
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">{warehouse.name}</p>
                <p className="text-xs text-slate-500">{warehouse.code} • {warehouse.city}, {warehouse.state}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {warehouse._count?.stocks ?? 0} stock rows • {warehouse._count?.alerts ?? 0} alerts
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {warehouseAlertStats.get(warehouse.id)?.critical ?? 0} critical • {warehouseAlertStats.get(warehouse.id)?.low ?? 0} low
                </p>
                <div className="mt-2">
                  {(warehouseAlertStats.get(warehouse.id)?.critical ?? 0) > 0 ? (
                    <span className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                      Critical
                    </span>
                  ) : (warehouseAlertStats.get(warehouse.id)?.low ?? 0) > 0 ? (
                    <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                      Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                      Healthy
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Last updated {new Date(warehouse.updatedAt).toLocaleString()}
                </p>
                {canManageWarehouseEntity && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleDeleteWarehouse(warehouse.id)
                    }}
                    className="mt-3 rounded border border-rose-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-600"
                  >
                    Delete
                  </button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedWarehouse && (
        <div
          ref={selectedWarehousePanelRef}
          className="surface-panel space-y-4 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Selected Warehouse</h2>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedWarehouse.name}</p>
              <p className="text-xs text-slate-500">
                {selectedWarehouse.code} • {selectedWarehouse.city}, {selectedWarehouse.state}
              </p>
            </div>
            <div className="surface-subtle flex flex-wrap items-center gap-1 bg-slate-50 p-1 dark:bg-slate-800/40">
              {actionTabs.filter((tab) => tab.visible).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-all duration-150 ${
                    activeTab === tab.key
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-amber-300'
                      : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'settings' && canManageWarehouseEntity && (
            <form onSubmit={handleUpdateWarehouse} className="surface-subtle p-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Edit Warehouse Details</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={warehouseEdit.name}
                  onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Name"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                />
                <input
                  value={warehouseEdit.code}
                  onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Code"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                />
                <input
                  value={warehouseEdit.city}
                  onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                />
                <input
                  value={warehouseEdit.state}
                  onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                />
                <input
                  value={warehouseEdit.address}
                  onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Address (optional)"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-900/70"
                />
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={warehouseEdit.isActive}
                  onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
              <button
                type="submit"
                disabled={updateWarehouse.isPending}
                className="mt-4 block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
              >
                {updateWarehouse.isPending ? 'Saving...' : 'Save Warehouse'}
              </button>
            </form>
          )}

          {activeTab === 'stock' && canUpdateWarehouseStock && (
            <>
            <div className="grid gap-4 lg:grid-cols-2">
              <form onSubmit={handleSetStock} className="surface-subtle p-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Stock Adjustment</h3>
                <p className="mt-1 text-xs text-slate-500">Set the new on-hand quantity for the selected book in this warehouse.</p>
                <div className="mt-4 space-y-3">
                  <input
                    value={stockBookSearch}
                    onChange={(e) => {
                      setStockBookSearch(e.target.value)
                      setStockForm((prev) => ({ ...prev, bookId: '' }))
                    }}
                    placeholder="Search book by title"
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                  />
                  {stockBookSearch.length > 0 && (
                    <div className="max-h-44 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white/65 p-2 dark:border-slate-700 dark:bg-slate-900/55">
                      {stockBookOptions.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => chooseStockBook(book.id, book.title)}
                          className={`w-full rounded px-2 py-1 text-left text-sm ${
                            stockForm.bookId === book.id ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <p className="font-medium">{book.title}</p>
                          <p className="text-xs text-slate-500">{book.author}</p>
                        </button>
                      ))}
                      {stockBookOptions.length === 0 && <p className="text-xs text-slate-500">No matching books. Try title keywords.</p>}
                    </div>
                  )}
                  {stockForm.bookId && (
                    <p className="text-xs text-slate-500">
                      Selected: {selectedStockBook ? `${selectedStockBook.title} • ${selectedStockBook.author}` : stockBookSearch}
                    </p>
                  )}
                  {stockForm.bookId && (
                    <p className="text-xs text-slate-500">
                      {selectedStockRow
                        ? `Current in this warehouse: ${selectedStockRow.stock} units (threshold ${selectedStockRow.lowStockThreshold})`
                        : 'This book has no stock row in this warehouse yet. Saving will create one.'}
                    </p>
                  )}
                  {stockForm.bookId && selectedStockBook && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">
                        Company total stock: {selectedStockBook.stock} units across all warehouses.
                      </p>
                      {selectedStockBook.stock <= 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-900/20">
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            No stock exists in any warehouse for this book. Create a purchase request to restock.
                          </p>
                          <Link
                            to={`/admin/purchase-requests?warehouseId=${selectedWarehouseId}&bookId=${stockForm.bookId}`}
                            className="mt-2 inline-flex rounded-md border border-amber-300 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
                          >
                            Create Purchase Request
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    New On-hand Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockForm.stock}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, stock: e.target.value }))}
                    placeholder="e.g. 24"
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                  />
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Low-stock Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={stockForm.lowStockThreshold}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                    placeholder="e.g. 5"
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                  />
                  <button
                    type="submit"
                    disabled={setStock.isPending || !stockForm.bookId}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
                  >
                    {setStock.isPending ? 'Saving...' : 'Save Stock Level'}
                  </button>
                </div>
              </form>

              <div className="surface-subtle p-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Current Stock Snapshot</h3>
                {selectedStockRow && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/40">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedStockRow.book.title}</p>
                    <p className="text-xs text-slate-500">
                      Current stock {selectedStockRow.stock} • threshold {selectedStockRow.lowStockThreshold}
                    </p>
                  </div>
                )}
                <div className="mt-3 max-h-72 space-y-2 overflow-auto">
                  {stocks.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => chooseStockBook(row.bookId, row.book.title)}
                    className="w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-left text-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/65"
                    >
                      <p className="font-medium text-slate-800 dark:text-slate-100">{row.book.title}</p>
                      <p className="text-xs text-slate-500">Stock {row.stock} • threshold {row.lowStockThreshold}</p>
                    </button>
                  ))}
                  {stocks.length === 0 && <p className="text-sm text-slate-500">No stock rows yet.</p>}
                </div>
              </div>
            </div>

            </>
          )}

          {activeTab === 'transfer' && canTransferWarehouse && (
            <form onSubmit={handleTransfer} className="surface-subtle p-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Transfer Stock</h3>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <input
                    value={transferBookSearch}
                    onChange={(e) => {
                      setTransferBookSearch(e.target.value)
                      setTransferForm((prev) => ({ ...prev, bookId: '' }))
                    }}
                    placeholder="Search book by title"
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                  />
                  {transferBookSearch.length > 0 && (
                    <div className="mt-2 max-h-44 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white/65 p-2 dark:border-slate-700 dark:bg-slate-900/55">
                      {transferBookOptions.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => chooseTransferBook(book.id, book.title)}
                          className={`w-full rounded px-2 py-1 text-left text-sm ${
                            transferForm.bookId === book.id ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <p className="font-medium">{book.title}</p>
                          <p className="text-xs text-slate-500">{book.author}</p>
                        </button>
                      ))}
                      {transferBookOptions.length === 0 && <p className="text-xs text-slate-500">No matching books. Try title keywords.</p>}
                    </div>
                  )}
                  {transferForm.bookId && (
                    <p className="mt-2 text-xs text-slate-500">
                      Selected: {selectedTransferBook ? `${selectedTransferBook.title} • ${selectedTransferBook.author}` : transferBookSearch}
                    </p>
                  )}
                </div>

                <select
                  value={transferForm.fromWarehouseId}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, fromWarehouseId: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                >
                  <option value="">From warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                <select
                  value={transferForm.toWarehouseId}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, toWarehouseId: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                >
                  <option value="">To warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Quantity"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                />
                <input
                  value={transferForm.note}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Note (optional)"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                />
              </div>
              <button
                type="submit"
                disabled={transferStock.isPending}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
              >
                {transferStock.isPending ? 'Transferring...' : 'Create Transfer'}
              </button>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="surface-subtle p-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Transfer History</h3>
              <div className="mt-4 max-h-80 space-y-2 overflow-auto">
                {filteredTransfers.length === 0 && <p className="text-sm text-slate-500">No transfers for this warehouse yet.</p>}
                {filteredTransfers.map((transfer) => (
                  <div key={transfer.id} className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/65">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {transfer.book.title} • {transfer.quantity} units
                    </p>
                    <p className="text-xs text-slate-500">
                      {transfer.fromWarehouse.code} → {transfer.toWarehouse.code} • {new Date(transfer.createdAt).toLocaleString()}
                    </p>
                    {transfer.note && <p className="mt-1 text-xs text-slate-500">Note: {transfer.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminWarehousesPage
