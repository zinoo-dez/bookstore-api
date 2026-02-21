import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, PackageCheck, RefreshCw } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getErrorMessage } from '@/lib/api'
import { useWarehouseAlerts, useWarehouseStocks, useWarehouseTransfers, useWarehouses } from '@/services/warehouses'
import { useCompleteWarehouseDeliveryTask, useWarehouseDeliveryTasks } from '@/services/orders'

const SELECTED_WAREHOUSE_KEY = 'warehouse-dashboard:selected-warehouse'

const WarehouseDashboardPage = () => {
  const [trendRange, setTrendRange] = useState<7 | 30 | 90>(30)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(SELECTED_WAREHOUSE_KEY) || ''
  })

  const { data: warehouses = [] } = useWarehouses()
  const { data: alerts = [] } = useWarehouseAlerts('OPEN')
  const { data: transfers = [] } = useWarehouseTransfers(200)
  const selectedWarehouseExists = warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)
  const effectiveWarehouseId = selectedWarehouseExists ? selectedWarehouseId : (warehouses[0]?.id || '')
  const { data: selectedStocks = [] } = useWarehouseStocks(effectiveWarehouseId || undefined)
  const { data: tasks = [] } = useWarehouseDeliveryTasks()
  const completeTask = useCompleteWarehouseDeliveryTask()
  const [taskMessage, setTaskMessage] = useState('')

  const effectiveStocks = selectedStocks

  const onWarehouseChange = (id: string) => {
    setSelectedWarehouseId(id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SELECTED_WAREHOUSE_KEY, id)
    }
  }

  const scopedAlerts = useMemo(
    () => alerts.filter((item) => !effectiveWarehouseId || item.warehouseId === effectiveWarehouseId),
    [alerts, effectiveWarehouseId],
  )
  const rankedAlerts = useMemo(() => {
    const rank = (stock: number) => {
      if (stock === 0) return 0
      if (stock <= 2) return 1
      return 2
    }
    return [...scopedAlerts].sort((a, b) => rank(a.stock) - rank(b.stock))
  }, [scopedAlerts])

  const deliveryTasks = useMemo(
    () => tasks.filter((task) => task.type === 'order-delivery'),
    [tasks],
  )
  const openDeliveryTasks = useMemo(
    () => deliveryTasks.filter((task) => task.status !== 'COMPLETED'),
    [deliveryTasks],
  )
  const completedDeliveryTasks = useMemo(
    () => deliveryTasks.filter((task) => task.status === 'COMPLETED').slice(0, 8),
    [deliveryTasks],
  )

  const getDeliverySla = (createdAt: string, completedAt?: string | null) => {
    const created = new Date(createdAt)
    const due = new Date(created)
    due.setDate(due.getDate() + 3)
    const now = new Date()
    const finish = completedAt ? new Date(completedAt) : now
    const late = finish.getTime() > due.getTime()
    const msLeft = due.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    if (completedAt) {
      return {
        label: late ? 'Completed Late' : 'Completed On Time',
        tone: late
          ? 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
          : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
      }
    }

    if (late) {
      return {
        label: 'Late',
        tone: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
      }
    }
    if (daysLeft <= 1) {
      return {
        label: 'Due Soon',
        tone: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      }
    }
    return {
      label: 'On Time',
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    }
  }

  useEffect(() => {
    if (warehouses.length === 0) return
    if (!selectedWarehouseId || !selectedWarehouseExists) {
      onWarehouseChange(warehouses[0].id)
    }
  }, [selectedWarehouseId, selectedWarehouseExists, warehouses])

  const inventoryTrend = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (trendRange - 1))
    const days = Array.from({ length: trendRange }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        incoming: 0,
        outgoing: 0,
      }
    })
    const map = new Map(days.map((d) => [d.key, d]))

    transfers.forEach((transfer) => {
      const key = new Date(transfer.createdAt).toISOString().slice(0, 10)
      const bucket = map.get(key)
      if (!bucket) return
      if (!effectiveWarehouseId) {
        bucket.incoming += transfer.quantity
        bucket.outgoing += transfer.quantity
        return
      }
      if (transfer.toWarehouseId === effectiveWarehouseId) bucket.incoming += transfer.quantity
      if (transfer.fromWarehouseId === effectiveWarehouseId) bucket.outgoing += transfer.quantity
    })

    return days
  }, [transfers, effectiveWarehouseId, trendRange])

  const incoming30 = inventoryTrend.reduce((sum, day) => sum + day.incoming, 0)
  const outgoing30 = inventoryTrend.reduce((sum, day) => sum + day.outgoing, 0)
  const totalSkus = effectiveWarehouseId
    ? effectiveStocks.length
    : warehouses.reduce((sum, warehouse) => sum + (warehouse._count?.stocks ?? 0), 0)
  const activeAlerts = scopedAlerts.length
  const criticalAlerts = scopedAlerts.filter((alert) => alert.stock === 0).length
  const lowStockItems = scopedAlerts.filter((alert) => alert.stock > 0 && alert.stock <= 3).length
  const restockTasksToday = scopedAlerts.length

  const showTaskMessage = (text: string) => {
    setTaskMessage(text)
    window.setTimeout(() => setTaskMessage(''), 2600)
  }

  const onCompleteDeliveryTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId)
      showTaskMessage('Delivery task completed. Linked order status moved to COMPLETED.')
    } catch (error) {
      showTaskMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="p-8 space-y-6 dark:text-slate-100">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Warehouse</p>
          <h1 className="text-3xl font-bold">Warehouse Dashboard</h1>
          <p className="mt-2 text-slate-500">Operational control panel for inventory, transfers, alerts, and delivery tasks.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300">
          WAREHOUSE STAFF
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/90">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Selected Warehouse</label>
        <select
          value={effectiveWarehouseId}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className="mt-2 w-full max-w-sm rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name} ({warehouse.code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total SKUs" value={totalSkus} subtitle={effectiveWarehouseId ? 'In selected warehouse' : `Across ${warehouses.length} warehouses`} icon={<Boxes className="h-5 w-5" />} />
        <StatCard title="Low Stock Items" value={lowStockItems} subtitle="Needs restock attention" icon={<AlertTriangle className="h-5 w-5" />} valueClassName="text-amber-600 dark:text-amber-300" />
        <StatCard title="Restock Tasks Today" value={restockTasksToday} subtitle="Open low-stock actions" icon={<RefreshCw className="h-5 w-5" />} />
        <StatCard title="Active Alerts" value={activeAlerts} subtitle="All severities" icon={<PackageCheck className="h-5 w-5" />} valueClassName="text-yellow-600 dark:text-yellow-300" />
        <StatCard title="Critical (0 stock)" value={criticalAlerts} subtitle="Immediate action required" icon={<AlertTriangle className="h-5 w-5" />} valueClassName="text-rose-600 dark:text-rose-300" />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Inventory Trend</h2>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
              {[7, 30, 90].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTrendRange(range as 7 | 30 | 90)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-150 ${
                    trendRange === range
                      ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {range}d
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500">
            <span className="mr-4 inline-flex items-center gap-1"><ArrowDownToLine className="h-3.5 w-3.5" /> Incoming: {incoming30}</span>
            <span className="inline-flex items-center gap-1"><ArrowUpFromLine className="h-3.5 w-3.5" /> Outgoing: {outgoing30}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Incoming</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Outgoing</span>
          <span>{trendRange}-day window</span>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={inventoryTrend}>
              <defs>
                <linearGradient id="incomingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="outgoingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="incoming" stroke="#22c55e" fill="url(#incomingFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="outgoing" stroke="#f59e0b" fill="url(#outgoingFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Delivery Tasks</h2>
            <span className="text-xs text-slate-500">{openDeliveryTasks.length} open</span>
          </div>

          {taskMessage && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              {taskMessage}
            </div>
          )}

          <div className="mt-4 overflow-auto rounded-xl border border-slate-200/70 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-3 py-2 text-left">Task</th>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Books</th>
                  <th className="px-3 py-2 text-left">Assigned To</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">SLA</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {openDeliveryTasks.map((task) => {
                  const meta = (task.metadata || {}) as { orderId?: string }
                  const sla = getDeliverySla(task.createdAt)
                  return (
                    <tr key={task.id}>
                      <td className="px-3 py-2">Order Delivery</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {meta.orderId ? meta.orderId.slice(0, 8).toUpperCase() : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          {(task.order?.orderItems ?? []).slice(0, 3).map((item) => (
                            <p key={item.id} className="text-xs">
                              {item.book.title} <span className="text-slate-500">x{item.quantity}</span>
                            </p>
                          ))}
                          {(task.order?.orderItems?.length ?? 0) > 3 && (
                            <p className="text-xs text-slate-500">+{(task.order?.orderItems?.length ?? 0) - 3} more</p>
                          )}
                          {(task.order?.orderItems?.length ?? 0) === 0 && (
                            <p className="text-xs text-slate-500">No item details</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">{task.staff.user.name}</td>
                      <td className="px-3 py-2">{task.priority}</td>
                      <td className="px-3 py-2">{task.status}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${sla.tone}`}>
                          {sla.label}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void onCompleteDeliveryTask(task.id)}
                          disabled={completeTask.isPending}
                          className="rounded border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 transition-all duration-150 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700/40 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {openDeliveryTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-sm text-slate-500">
                      No open delivery tasks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Recently Completed</h3>
            <div className="mt-2 space-y-2">
              {completedDeliveryTasks.map((task) => {
                const meta = (task.metadata || {}) as { orderId?: string }
                const sla = getDeliverySla(task.createdAt, task.completedAt)
                return (
                  <div key={task.id} className="rounded-lg border border-slate-200/70 px-3 py-2 text-sm transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
                    <p className="font-medium">Order {meta.orderId ? meta.orderId.slice(0, 8).toUpperCase() : '-'}</p>
                    <p className="text-xs text-slate-500">
                      Completed by {task.staff.user.name} • {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
                    </p>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${sla.tone}`}>
                      {sla.label}
                    </span>
                  </div>
                )
              })}
              {completedDeliveryTasks.length === 0 && <p className="text-sm text-slate-500">No completed delivery tasks yet.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Low Stock Alerts</h2>
          <div className="mt-4 divide-y rounded-xl border border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30 max-h-72 overflow-auto">
            {scopedAlerts.length === 0 && <p className="text-sm text-slate-500">No open low-stock alerts.</p>}
            {rankedAlerts.map((alert) => {
              const severity = getAlertSeverity(alert.stock)
              return (
                <div key={alert.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{alert.book.title}</p>
                    <p className="text-xs text-slate-500">
                      {alert.warehouse.code} • stock {alert.stock} / threshold {alert.threshold}
                    </p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${severity.text}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${severity.dot}`} />
                    {severity.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Link to="/admin/warehouses" className="rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Adjust Stock
            </Link>
            <Link to="/admin/warehouses" className="rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Transfer Stock
            </Link>
            <Link to="/admin/purchase-requests" className="rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Create Purchase Request
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  valueClassName = '',
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  valueClassName?: string
}) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
    </div>
    <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
    <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
  </div>
)

export default WarehouseDashboardPage
  const getAlertSeverity = (stock: number) => {
    if (stock === 0) {
      return {
        label: 'Critical',
        dot: 'bg-rose-500',
        text: 'text-rose-700 dark:text-rose-300',
      }
    }
    if (stock <= 2) {
      return {
        label: 'High',
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-300',
      }
    }
    return {
      label: 'Medium',
      dot: 'bg-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-300',
    }
  }
