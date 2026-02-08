import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { useAdminOrders, useUpdateOrderStatus, type Order } from '@/services/orders'
import Skeleton from '@/components/ui/Skeleton'
import OrderStatusModal from '@/components/admin/OrderStatusModal'
import { getErrorMessage } from '@/lib/api'

const AdminOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [sortKey, setSortKey] = useState<'createdAt' | 'totalPrice' | 'items' | 'status'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)

  const { data: orders, isLoading } = useAdminOrders()
  const updateOrderStatus = useUpdateOrderStatus()

  const allOrders = orders || []

  // Filter orders
  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const pendingOrders = allOrders.filter(o => o.status === 'PENDING').length
  const completedOrders = allOrders.filter(o => o.status === 'COMPLETED').length


  const handleUpdateStatus = async (status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
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

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const densityPad = density === 'compact' ? 'py-2' : 'py-3'

  return (
    <div className="p-8 dark:text-slate-100">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Orders Management</h1>
            <p className="text-gray-600 mt-1 dark:text-slate-400">View and manage all orders</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-rose-950/60 dark:border-rose-900/60">
            <p className="text-red-600 text-sm dark:text-rose-200">{error}</p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto]">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Density</span>
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                  density === 'comfortable'
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Comfy
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                  density === 'compact'
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-4 rounded-2xl border dark:bg-slate-900 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{allOrders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border dark:bg-slate-900 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-amber-300">{pendingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border dark:bg-slate-900 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-emerald-300">{completedOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border dark:bg-slate-900 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-amber-300">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b dark:bg-slate-950/60 dark:border-slate-800 sticky top-0">
              <tr>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  Rank
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>Order ID</th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-2">
                    Date
                    {sortKey === 'createdAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('items')} className="inline-flex items-center gap-2">
                    Items
                    {sortKey === 'items' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('totalPrice')} className="inline-flex items-center gap-2">
                    Total
                    {sortKey === 'totalPrice' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-2">
                    Status
                    {sortKey === 'status' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-800">
              {sortedOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`hover:bg-gray-50 dark:hover:bg-slate-800/60 odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 ${
                    recentOrderId === order.id ? 'ring-2 ring-amber-300/60' : ''
                  }`}
                >
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                    <span className="text-sm text-gray-500 dark:text-slate-500">#{index + 1}</span>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center dark:bg-amber-900/30">
                        <span className="text-sm">📦</span>
                      </div>
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-slate-100">
                        {order.id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                    <span className="text-sm text-gray-600 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-slate-500">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                    <span className="text-sm text-gray-900 dark:text-slate-100">
                      {order.orderItems.length} items
                    </span>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                    <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      ${Number(order.totalPrice).toFixed(2)}
                    </span>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/40 dark:text-amber-200'
                          : 'bg-red-100 text-red-800 dark:bg-rose-900/40 dark:text-rose-200'
                        }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className={`px-6 ${densityPad} whitespace-nowrap text-sm`}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUpdatingOrder(order)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                        title="Update Status"
                        aria-label="Update order status"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
      <div className="px-6 py-4 border-t bg-gray-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between dark:bg-slate-950 dark:border-slate-800">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Showing {filteredOrders.length} of {allOrders.length} orders
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:border-slate-800 dark:hover:text-amber-300 dark:hover:border-amber-300">
              Previous
            </button>
            <button className="px-3 py-1 bg-primary-600 text-white rounded dark:bg-amber-400 dark:text-slate-900">
              1
            </button>
            <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:border-slate-800 dark:hover:text-amber-300 dark:hover:border-amber-300">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <OrderStatusModal
        isOpen={!!updatingOrder}
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
  )
}

export default AdminOrdersPage
