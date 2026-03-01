import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { useAdminOrders, useUpdateOrderStatus, type Order } from '@/services/orders'
import Skeleton from '@/components/ui/Skeleton'
import OrderStatusModal from '@/components/admin/OrderStatusModal'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useSearchParams } from 'react-router-dom'

const isOrderStatusFilter = (value: string | null) =>
  value === 'all' ||
  value === 'PENDING' ||
  value === 'CONFIRMED' ||
  value === 'COMPLETED' ||
  value === 'CANCELLED'

const AdminOrdersPage = () => {
  const user = useAuthStore((state) => state.user)
  const canManagePayouts =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'finance.payout.manage')
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('q') ?? searchParams.get('orderId') ?? '',
  )
  const [customerTerm, setCustomerTerm] = useState(searchParams.get('customer') ?? '')
  const [locationTerm, setLocationTerm] = useState(searchParams.get('location') ?? '')
  const [statusFilter, setStatusFilter] = useState(
    isOrderStatusFilter(searchParams.get('status')) ? (searchParams.get('status') as string) : 'all',
  )
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('to') ?? '')
  const [minValue, setMinValue] = useState(searchParams.get('min') ?? '')
  const [maxValue, setMaxValue] = useState(searchParams.get('max') ?? '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    searchParams.get('advanced') === '1',
  )
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<'createdAt' | 'totalPrice' | 'items' | 'status'>(
    (() => {
      const raw = searchParams.get('sort')
      if (raw === 'totalPrice' || raw === 'items' || raw === 'status') return raw
      return 'createdAt'
    })(),
  )
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
    searchParams.get('dir') === 'asc' ? 'asc' : 'desc',
  )
  const [visibleColumns, setVisibleColumns] = useState({
    rank: true,
    orderId: true,
    customer: true,
    location: true,
    payment: true,
    date: true,
    items: true,
    total: true,
    status: true,
    actions: true,
  })
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)

  const { data: orders, isLoading } = useAdminOrders()
  const updateOrderStatus = useUpdateOrderStatus()

  const allOrders = orders || []

  const customerOrderCount = useMemo(() => {
    const map = new Map<string, number>()
    allOrders.forEach((order) => {
      map.set(order.userId, (map.get(order.userId) || 0) + 1)
    })
    return map
  }, [allOrders])

  const filteredOrders = allOrders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    const total = Number(order.totalPrice)

    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const customerText = `${order.user?.name || ''} ${order.user?.email || ''}`.toLowerCase()
    const matchesCustomer = customerText.includes(customerTerm.toLowerCase())
    const pickupStoreText = order.pickupStore
      ? `${order.pickupStore.name} ${order.pickupStore.city} ${order.pickupStore.state} ${order.pickupStore.code}`
      : ''
    const orderLocationText =
      `${pickupStoreText} ${order.shippingAddress || ''} ${order.shippingCity || ''} ${order.shippingState || ''} ${order.shippingZipCode || ''} ${order.shippingCountry || ''}`.toLowerCase()
    const matchesLocation = orderLocationText.includes(locationTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    const matchesFromDate = !dateFrom || orderDate >= new Date(`${dateFrom}T00:00:00`)
    const matchesToDate = !dateTo || orderDate <= new Date(`${dateTo}T23:59:59`)
    const matchesMinValue = !minValue || total >= Number(minValue)
    const matchesMaxValue = !maxValue || total <= Number(maxValue)

    return (
      matchesSearch &&
      matchesCustomer &&
      matchesLocation &&
      matchesStatus &&
      matchesFromDate &&
      matchesToDate &&
      matchesMinValue &&
      matchesMaxValue
    )
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'totalPrice':
        return (Number(a.totalPrice) - Number(b.totalPrice)) * dir
      case 'items':
        return (a.orderItems.length - b.orderItems.length) * dir
      case 'status':
        return a.status.localeCompare(b.status) * dir
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
    }
  })

  const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length
  const confirmedOrders = allOrders.filter((o) => o.status === 'CONFIRMED').length
  const completedOrders = allOrders.filter((o) => o.status === 'COMPLETED').length
  const avgOrderValue = allOrders.length ? totalRevenue / allOrders.length : 0

  const handleUpdateStatus = async (status: 'PENDING' | 'CONFIRMED') => {
    if (!canManagePayouts) {
      setError('Missing permission: finance.payout.manage')
      return
    }
    if (!updatingOrder) return
    try {
      setError('')
      await updateOrderStatus.mutateAsync({ orderId: updatingOrder.id, status })
      setRecentOrderId(updatingOrder.id)
      setUpdatingOrder(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (!recentOrderId) return
    const timeout = setTimeout(() => setRecentOrderId(null), 2000)
    return () => clearTimeout(timeout)
  }, [recentOrderId])

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (!orderId) return
    if (orderId !== searchTerm) {
      setSearchTerm(orderId)
    }
    setRecentOrderId(orderId)
  }, [searchParams, searchTerm])

  useEffect(() => {
    const next = new URLSearchParams()
    if (searchTerm) next.set('q', searchTerm)
    if (statusFilter !== 'all') next.set('status', statusFilter)
    if (dateFrom) next.set('from', dateFrom)
    if (dateTo) next.set('to', dateTo)
    if (sortKey !== 'createdAt') next.set('sort', sortKey)
    if (sortDir !== 'desc') next.set('dir', sortDir)
    if (showAdvancedFilters) next.set('advanced', '1')

    if (customerTerm) next.set('customer', customerTerm)
    if (locationTerm) next.set('location', locationTerm)
    if (minValue) next.set('min', minValue)
    if (maxValue) next.set('max', maxValue)

    setSearchParams(next, { replace: true })
  }, [
    customerTerm,
    dateFrom,
    dateTo,
    locationTerm,
    maxValue,
    minValue,
    searchTerm,
    setSearchParams,
    showAdvancedFilters,
    sortDir,
    sortKey,
    statusFilter,
  ])

  if (isLoading) {
    return (
      <div className="p-8 dark:text-slate-100 space-y-6">
        <Skeleton variant="logo" className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    )
  }

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rowPad = 'py-3'
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
    { key: 'rank', label: '#' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'location', label: 'Delivery Location' },
    { key: 'payment', label: 'Payment' },
    { key: 'date', label: 'Date' },
    { key: 'items', label: 'Items' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]
  const statusChipTone = (status: Order['status']) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    if (status === 'CONFIRMED') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/40 dark:text-amber-200'
    return 'bg-red-100 text-red-800 dark:bg-rose-900/40 dark:text-rose-200'
  }

  return (
    <div className="luxe-shell min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="section-kicker">Admin</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">Orders Management</h1>
            <p className="mt-1 text-gray-600 dark:text-slate-400">Filter by date/value/customer and manage statuses</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-6">
        <Stat label="Total Orders" value={allOrders.length} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <Stat label="Pending" value={pendingOrders} valueClassName="text-yellow-600 dark:text-amber-300" active={statusFilter === 'PENDING'} onClick={() => setStatusFilter('PENDING')} />
        <Stat label="Confirmed" value={confirmedOrders} valueClassName="text-blue-600 dark:text-blue-300" active={statusFilter === 'CONFIRMED'} onClick={() => setStatusFilter('CONFIRMED')} />
        <Stat label="Completed" value={completedOrders} valueClassName="text-green-600 dark:text-emerald-300" active={statusFilter === 'COMPLETED'} onClick={() => setStatusFilter('COMPLETED')} />
        <Stat label="Revenue" value={`$${totalRevenue.toFixed(2)}`} valueClassName="text-primary-600 dark:text-amber-300" />
        <Stat label="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} />
      </div>
        {error && (
          <div className="surface-subtle mb-4 border-red-300/60 bg-red-50/85 p-3 dark:border-rose-900/60 dark:bg-rose-950/60">
            <p className="text-red-600 text-sm dark:text-rose-200">{error}</p>
          </div>
        )}

        <div className="luxe-panel section-reveal relative z-30 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            placeholder="Search order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-left text-sm font-semibold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {showAdvancedFilters ? 'Hide' : 'More'} filters
          </button>
          <ColumnVisibilityMenu
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            options={columnOptions}
          />
        </div>

        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <input
              type="text"
              placeholder="Customer name/email..."
              value={customerTerm}
              onChange={(e) => setCustomerTerm(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <input
              type="text"
              placeholder="Order shipping location..."
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <input
              type="number"
              min="0"
              placeholder="Min value"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <input
              type="number"
              min="0"
              placeholder="Max value"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </motion.div>
        )}
        </div>
      </div>

      

      <div className="admin-table-wrapper relative z-0">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1400px]">
            <thead className="admin-table-head sticky top-0 z-0">
              <tr>
                {visibleColumns.rank && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>#</th>}
                {visibleColumns.orderId && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>Order ID</th>}
                {visibleColumns.customer && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>Customer</th>}
                {visibleColumns.location && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>Delivery Location</th>}
                {visibleColumns.payment && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>Payment</th>}
                {visibleColumns.date && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>
                    <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-2">Date {sortKey === 'createdAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
                {visibleColumns.items && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>
                    <button type="button" onClick={() => toggleSort('items')} className="inline-flex items-center gap-2">Items {sortKey === 'items' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
                {visibleColumns.total && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>
                    <button type="button" onClick={() => toggleSort('totalPrice')} className="inline-flex items-center gap-2">Total {sortKey === 'totalPrice' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
                {visibleColumns.status && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>
                    <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-2">Status {sortKey === 'status' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
                {visibleColumns.actions && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider`}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/60 ${index % 2 === 1 ? 'bg-slate-50/25 dark:bg-slate-950/20' : ''} ${recentOrderId === order.id ? 'ring-2 ring-amber-300/60' : ''}`}
                >
                  {visibleColumns.rank && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm text-gray-500 dark:text-slate-500`}>#{index + 1}</td>}
                  {visibleColumns.orderId && <td className={`px-6 ${rowPad} whitespace-nowrap`}><span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">{order.id.slice(-8).toUpperCase()}</span></td>}
                  {visibleColumns.customer && (
                    <td className={`px-6 ${rowPad}`}>
                      <p className="text-sm font-medium">{order.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{order.user?.email || 'No email'} • {customerOrderCount.get(order.userId) || 0} total orders</p>
                    </td>
                  )}
                  {visibleColumns.location && (
                    <td className={`px-6 ${rowPad}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {order.deliveryType === 'STORE_PICKUP' ? 'Store Pickup' : 'Home Delivery'}
                      </p>
                      {order.deliveryType === 'STORE_PICKUP' && order.pickupStore ? (
                        <>
                          <p className="text-sm">{order.pickupStore.name}</p>
                          <p className="text-xs text-slate-400">
                            {[order.pickupStore.city, order.pickupStore.state].filter(Boolean).join(', ')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">
                            {[order.shippingCity, order.shippingState].filter(Boolean).join(', ') || order.shippingCountry || '-'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {[order.shippingAddress, order.shippingZipCode, order.shippingCountry].filter(Boolean).join(' • ') || 'No shipping address captured'}
                          </p>
                        </>
                      )}
                    </td>
                  )}
                  {visibleColumns.payment && (
                    <td className={`px-6 ${rowPad}`}>
                      <p className="text-sm">{order.paymentProvider || '-'}</p>
                      <p className="text-xs text-slate-400">
                        {order.paymentReceiptUrl ? 'Receipt uploaded' : 'No receipt'}
                      </p>
                    </td>
                  )}
                  {visibleColumns.date && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm`}>{new Date(order.createdAt).toLocaleDateString()}</td>}
                  {visibleColumns.items && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm`}>{order.orderItems.length} items</td>}
                  {visibleColumns.total && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm font-semibold`}>${Number(order.totalPrice).toFixed(2)}</td>}
                  {visibleColumns.status && (
                    <td className={`px-6 ${rowPad} whitespace-nowrap`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusChipTone(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className={`px-6 ${rowPad} whitespace-nowrap text-sm`}>
                      {canManagePayouts && order.status === 'PENDING' ? (
                        <button
                          onClick={() => setUpdatingOrder(order)}
                          className="metal-button inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                          title="Update Status"
                          aria-label="Update order status"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {order.status === 'PENDING' ? 'View only' : 'No action'}
                        </span>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between dark:bg-slate-950 dark:border-slate-800">
          <div className="text-sm text-gray-600 dark:text-slate-400">Showing {filteredOrders.length} of {allOrders.length} orders</div>
          <div className="text-xs text-slate-500">Location filter matches shipping address and pickup store metadata.</div>
        </div>
      </div>

      <OrderStatusModal
        isOpen={canManagePayouts && !!updatingOrder}
        onClose={() => {
          setUpdatingOrder(null)
          setError('')
        }}
        onSubmit={handleUpdateStatus}
        currentStatus={updatingOrder?.status || 'PENDING'}
        orderId={updatingOrder?.id || ''}
        isLoading={updateOrderStatus.isPending}
      />
      </div>
    </div>
  )
}

const Stat = ({
  label,
  value,
  valueClassName = '',
  active = false,
  onClick,
}: {
  label: string
  value: string | number
  valueClassName?: string
  active?: boolean
  onClick?: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border border-slate-200/50 bg-white/45 p-4 text-left backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/35 ${
      active ? 'ring-2 ring-amber-300/70 dark:ring-amber-400/40' : ''
    } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
    <p className={`text-2xl font-bold text-gray-900 dark:text-slate-100 ${valueClassName}`}>{value}</p>
  </button>
)

export default AdminOrdersPage
