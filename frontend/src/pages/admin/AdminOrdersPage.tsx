import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { useAdminOrders, useUpdateOrderStatus, type Order } from '@/services/orders'
import Skeleton from '@/components/ui/Skeleton'
import OrderStatusModal from '@/components/admin/OrderStatusModal'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useSearchParams } from 'react-router-dom'

const AdminOrdersPage = () => {
  const user = useAuthStore((state) => state.user)
  const canManagePayouts =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'finance.payout.manage')
  const [searchTerm, setSearchTerm] = useState('')
  const [customerTerm, setCustomerTerm] = useState('')
  const [locationTerm, setLocationTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [sortKey, setSortKey] = useState<'createdAt' | 'totalPrice' | 'items' | 'status'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

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
    const orderLocationText =
      `${order.shippingAddress || ''} ${order.shippingCity || ''} ${order.shippingState || ''} ${order.shippingZipCode || ''} ${order.shippingCountry || ''}`.toLowerCase()
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
    setSearchTerm(orderId)
    setRecentOrderId(orderId)
  }, [searchParams])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const densityPad = density === 'compact' ? 'py-2' : 'py-3'
  const statusChipTone = (status: Order['status']) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    if (status === 'CONFIRMED') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/40 dark:text-amber-200'
    return 'bg-red-100 text-red-800 dark:bg-rose-900/40 dark:text-rose-200'
  }

  return (
    <div className="surface-canvas min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="section-kicker">Admin</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">Orders Management</h1>
            <p className="mt-1 text-gray-600 dark:text-slate-400">Filter by date/value/customer and manage statuses</p>
          </div>
        </div>

        {error && (
          <div className="surface-subtle mb-4 border-red-300/60 bg-red-50/85 p-3 dark:border-rose-900/60 dark:bg-rose-950/60">
            <p className="text-red-600 text-sm dark:text-rose-200">{error}</p>
          </div>
        )}

        <div className="surface-panel ui-fade-up p-4">
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Density</span>
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                    density === 'comfortable' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Comfy
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                    density === 'compact' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>
          </motion.div>
        )}
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

      <div className="surface-panel ui-fade-up overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-slate-50/80 dark:bg-slate-950/60 dark:border-slate-800 sticky top-0">
              <tr>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>#</th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>Order ID</th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>Customer</th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>Shipping Location</th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>Payment</th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-2">Date {sortKey === 'createdAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('items')} className="inline-flex items-center gap-2">Items {sortKey === 'items' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('totalPrice')} className="inline-flex items-center gap-2">Total {sortKey === 'totalPrice' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-2">Status {sortKey === 'status' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-transparent dark:divide-slate-800">
              {sortedOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60 ${index % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-950/20' : ''} ${recentOrderId === order.id ? 'ring-2 ring-amber-300/60' : ''}`}
                >
                  <td className={`px-6 ${densityPad} whitespace-nowrap text-sm text-gray-500 dark:text-slate-500`}>#{index + 1}</td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}><span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">{order.id.slice(-8).toUpperCase()}</span></td>
                  <td className={`px-6 ${densityPad}`}>
                    <p className="text-sm font-medium">{order.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{order.user?.email || 'No email'} • {customerOrderCount.get(order.userId) || 0} total orders</p>
                  </td>
                  <td className={`px-6 ${densityPad}`}>
                    <p className="text-sm">
                      {[order.shippingCity, order.shippingState].filter(Boolean).join(', ') || order.shippingCountry || '-'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {[order.shippingAddress, order.shippingZipCode, order.shippingCountry].filter(Boolean).join(' • ') || 'No shipping address captured'}
                    </p>
                  </td>
                  <td className={`px-6 ${densityPad}`}>
                    <p className="text-sm">{order.paymentProvider || '-'}</p>
                    <p className="text-xs text-slate-400">
                      {order.paymentReceiptUrl ? 'Receipt uploaded' : 'No receipt'}
                    </p>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap text-sm`}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap text-sm`}>{order.orderItems.length} items</td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap text-sm font-semibold`}>${Number(order.totalPrice).toFixed(2)}</td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusChipTone(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap text-sm`}>
                    {canManagePayouts && order.status === 'PENDING' ? (
                      <button
                        onClick={() => setUpdatingOrder(order)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
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
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between dark:bg-slate-950 dark:border-slate-800">
          <div className="text-sm text-gray-600 dark:text-slate-400">Showing {filteredOrders.length} of {allOrders.length} orders</div>
          <div className="text-xs text-slate-500">Location filter uses the shipping address entered on each order at checkout.</div>
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
    className={`surface-card p-4 text-left ${
      active ? 'ring-2 ring-amber-300/70 dark:ring-amber-400/40' : ''
    } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
    <p className={`text-2xl font-bold text-gray-900 dark:text-slate-100 ${valueClassName}`}>{value}</p>
  </button>
)

export default AdminOrdersPage
