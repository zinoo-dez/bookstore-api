import { Fragment, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import {
  useCreatePurchaseOrdersBatch,
  useCreatePurchaseOrder,
  usePurchaseOrders,
  usePurchaseRequests,
  useReceivePurchaseOrder,
  useVendors,
  useWarehouses,
  type PurchaseOrderStatus,
} from '@/services/warehouses'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

const statusOptions: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED']

const AdminPurchaseOrdersPage = () => {
  const user = useAuthStore((state) => state.user)
  const canCreate =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.purchase_order.create')
  const canReceive =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.purchase_order.receive')

  const { message, showMessage } = useTimedMessage(2600)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [warehouseId, setWarehouseId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [vendorSearch, setVendorSearch] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    vendorId: '',
    unitCost: '',
    expectedAt: '',
    notes: '',
  })
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])

  const { data: warehouses = [] } = useWarehouses()
  const { data: vendors = [] } = useVendors(true)
  const { data: approvedRequests = [] } = usePurchaseRequests({ status: 'APPROVED' })
  const { data: orders = [], error } = usePurchaseOrders({
    status: status || undefined,
    warehouseId: warehouseId || undefined,
    vendorId: vendorId || undefined,
  })
  const createOrder = useCreatePurchaseOrder()
  const createBatchOrders = useCreatePurchaseOrdersBatch()
  const receiveOrder = useReceivePurchaseOrder()

  const selectableRequests = useMemo(
    () => approvedRequests.filter((request) => !request.purchaseOrderId),
    [approvedRequests],
  )
  const filteredVendors = useMemo(() => {
    const keyword = vendorSearch.trim().toLowerCase()
    if (!keyword) return vendors
    return vendors.filter((vendor) =>
      vendor.name.toLowerCase().includes(keyword) || vendor.code.toLowerCase().includes(keyword),
    )
  }, [vendorSearch, vendors])

  const getStatusTone = (orderStatus: PurchaseOrderStatus) => {
    switch (orderStatus) {
      case 'CLOSED':
      case 'RECEIVED':
        return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
      case 'SENT':
      case 'PARTIALLY_RECEIVED':
        return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200'
      case 'CANCELLED':
        return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
      default:
        return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
    }
  }

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreate) {
      showMessage('Missing permission: warehouse.purchase_order.create')
      return
    }
    if (!createForm.vendorId) {
      showMessage('Vendor is required.')
      return
    }
    if (selectedRequestIds.length === 0) {
      showMessage('Select at least one approved request.')
      return
    }
    try {
      if (selectedRequestIds.length === 1) {
        await createOrder.mutateAsync({
          purchaseRequestId: selectedRequestIds[0],
          vendorId: createForm.vendorId,
          unitCost: createForm.unitCost ? Number(createForm.unitCost) : undefined,
          expectedAt: createForm.expectedAt || undefined,
          notes: createForm.notes || undefined,
        })
      } else {
        await createBatchOrders.mutateAsync({
          purchaseRequestIds: selectedRequestIds,
          vendorId: createForm.vendorId,
          unitCost: createForm.unitCost ? Number(createForm.unitCost) : undefined,
          expectedAt: createForm.expectedAt || undefined,
          notes: createForm.notes || undefined,
        })
      }
      setCreateForm({
        vendorId: '',
        unitCost: '',
        expectedAt: '',
        notes: '',
      })
      setSelectedRequestIds([])
      setIsCreatePanelOpen(false)
      showMessage(selectedRequestIds.length > 1 ? 'Batch purchase orders created.' : 'Purchase order created.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const toggleRequest = (id: string, checked: boolean) => {
    setSelectedRequestIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((item) => item !== id),
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(selectableRequests.map((request) => request.id))
      return
    }
    setSelectedRequestIds([])
  }

  const handleReceive = async (id: string) => {
    try {
      await receiveOrder.mutateAsync({ id, closeWhenFullyReceived: true })
      showMessage('Purchase order received and inventory updated.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Procurement</p>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="mt-1 text-slate-500">Create supplier orders from approved requests and receive stock into warehouses.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatePanelOpen(true)}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" />
          Create Purchase Order
        </button>
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
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Order Queue</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus | '')}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
              ))}
            </select>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.code}</option>
              ))}
            </select>
          </div>

          <div className="admin-table-wrapper mt-4 overflow-auto">
            <table className="admin-table min-w-full text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Warehouse</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Items</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const canReceiveThis = canReceive && ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(order.status)
                  const isExpanded = expandedOrderId === order.id
                  return (
                    <Fragment key={order.id}>
                    <tr>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                          className="font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                        >
                          {order.id.slice(0, 8)}
                        </button>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-3 py-2">{order.vendor.code}</td>
                      <td className="px-3 py-2">{order.warehouse.code}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusTone(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-xs text-slate-600 dark:text-slate-300">{order.items.length} item(s)</p>
                      </td>
                      <td className="px-3 py-2">
                        {canReceiveThis ? (
                          <button
                            type="button"
                            onClick={() => void handleReceive(order.id)}
                            className="rounded border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700"
                          >
                            Receive All
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No action</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50/70 px-3 py-2 dark:bg-slate-950/40">
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <p key={item.id} className="text-xs text-slate-600 dark:text-slate-300">
                                {item.book.title} by {item.book.author} • received {item.receivedQuantity}/{item.orderedQuantity}
                              </p>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })}
                {orders.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>No purchase orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      <AdminSlideOverPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="Procurement"
        title="Create Purchase Order"
        description="Create single or batch orders from approved purchase requests."
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
              form="create-po-form"
              disabled={(createOrder.isPending || createBatchOrders.isPending) || !canCreate}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {(createOrder.isPending || createBatchOrders.isPending)
                ? 'Creating...'
                : selectedRequestIds.length > 1
                  ? `Create ${selectedRequestIds.length} Purchase Orders`
                  : 'Create Purchase Order'}
            </button>
          </div>
        )}
      >
        <form
          id="create-po-form"
          onSubmit={submitCreate}
          className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45"
        >
          <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Approved Requests</p>
              <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={selectableRequests.length > 0 && selectedRequestIds.length === selectableRequests.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                Select all
              </label>
            </div>
            <div className="max-h-52 space-y-1 overflow-auto">
              {selectableRequests.map((request) => (
                <label key={request.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={selectedRequestIds.includes(request.id)}
                    onChange={(e) => toggleRequest(request.id, e.target.checked)}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {request.book.title} • {request.warehouse.code}
                    </p>
                    <p className="text-slate-500">
                      qty {request.approvedQuantity || request.quantity} • {request.book.author}
                    </p>
                  </div>
                </label>
              ))}
              {selectableRequests.length === 0 && (
                <p className="px-2 py-1 text-xs text-slate-500">No approved requests waiting for order creation.</p>
              )}
            </div>
            {selectedRequestIds.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">{selectedRequestIds.length} request(s) selected</p>
            )}
          </div>

          <select
            value={createForm.vendorId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, vendorId: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">Select vendor</option>
            {filteredVendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.code} • {vendor.name}
              </option>
            ))}
          </select>
          <input
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendor by code or name"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />

          <input
            type="number"
            min={0}
            step="0.01"
            value={createForm.unitCost}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, unitCost: e.target.value }))}
            placeholder="Unit cost (optional)"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />

          <input
            type="datetime-local"
            value={createForm.expectedAt}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, expectedAt: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <p className="text-xs text-slate-500">Expected delivery date/time (optional)</p>

          <textarea
            value={createForm.notes}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </form>
      </AdminSlideOverPanel>
    </div>
  )
}

export default AdminPurchaseOrdersPage
