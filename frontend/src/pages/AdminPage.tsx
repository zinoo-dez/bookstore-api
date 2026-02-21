import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, BookOpen, CheckSquare, ChevronDown, DollarSign, Package, Plus, TrendingUp, Users } from 'lucide-react'
import BookFormModal from '@/components/admin/BookFormModal'
import { useBooks } from '@/services/books'
import { useAdminOrders, type Order } from '@/services/orders'
import { useUsers } from '@/services/users'
import { useStaffPerformance } from '@/services/staff'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/lib/permissions'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'

type TrendRange = '7d' | '30d' | '12m'
type TrendMetric = 'revenue' | 'orders' | 'both'

type TrendPoint = {
  key: string
  label: string
  orders: number
  revenue: number
}

const KPI_WORKLOAD_TARGET = 4
const KPI_COMPLETION_TARGET = 75

const AdminPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [trendRange, setTrendRange] = useState<TrendRange>('30d')
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('revenue')
  const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false)
  const metricMenuRef = useRef<HTMLDivElement | null>(null)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!metricMenuRef.current) return
      if (!metricMenuRef.current.contains(event.target as Node)) {
        setIsMetricMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const canViewUsers = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const canViewOrders =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'finance.reports.view')
  const canViewPerformance =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'hr.performance.manage')

  const { data: booksData, isLoading: booksLoading } = useBooks({ limit: 100 })
  const { data: orders, isLoading: ordersLoading } = useAdminOrders({
    enabled: canViewOrders,
  })
  const { data: users, isLoading: usersLoading } = useUsers({
    enabled: canViewUsers,
  })
  const { data: performance } = useStaffPerformance(undefined, {
    enabled: canViewPerformance,
  })

  const books = booksData?.books || []
  const allOrders = orders || []
  const allUsers = users || []

  const totalOrders = allOrders.length
  const totalUsers = allUsers.length
  const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const outOfStockBooks = books.filter((book) => book.stock === 0)
  const lowStockBooks = books.filter((book) => book.stock > 0 && book.stock <= 10)
  const restockCandidates = [...outOfStockBooks, ...lowStockBooks].sort((a, b) => a.stock - b.stock)

  const pendingOrders = allOrders.filter((order) => order.status === 'PENDING').length
  const recentOrders = allOrders.slice(0, 5)

  const todayKey = new Date().toISOString().slice(0, 10)
  const todayOrders = allOrders.filter((order) => order.createdAt.slice(0, 10) === todayKey)
  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)

  const salesTrendData = useMemo<TrendPoint[]>(() => {
    const now = new Date()

    if (trendRange === '12m') {
      const months = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
        const label = date.toLocaleDateString(undefined, { month: 'short' })
        return {
          key: `${date.getFullYear()}-${date.getMonth()}`,
          label,
          orders: 0,
          revenue: 0,
        }
      })

      const monthMap = new Map(months.map((month) => [month.key, month]))
      allOrders.forEach((order) => {
        const d = new Date(order.createdAt)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const bucket = monthMap.get(key)
        if (bucket) {
          bucket.orders += 1
          bucket.revenue += Number(order.totalPrice)
        }
      })

      return months
    }

    const dayCount = trendRange === '7d' ? 7 : 30
    const days = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(now)
      date.setDate(now.getDate() - (dayCount - 1 - index))
      const key = date.toISOString().slice(0, 10)
      return {
        key,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        orders: 0,
        revenue: 0,
      }
    })

    const dayMap = new Map(days.map((day) => [day.key, day]))
    allOrders.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().slice(0, 10)
      const bucket = dayMap.get(key)
      if (bucket) {
        bucket.orders += 1
        bucket.revenue += Number(order.totalPrice)
      }
    })

    return days
  }, [allOrders, trendRange])

  const trendSummary = useMemo(() => {
    const values = salesTrendData.map((point) => ({
      revenue: Number(point.revenue || 0),
      orders: Number(point.orders || 0),
    }))

    if (values.length === 0) {
      return {
        currentRevenue: 0,
        previousRevenue: 0,
        currentOrders: 0,
        previousOrders: 0,
      }
    }

    const split = Math.max(1, Math.floor(values.length / 2))
    const currentSlice = values.slice(values.length - split)
    const previousSlice = values.slice(0, values.length - split)

    const sum = (list: Array<{ revenue: number; orders: number }>, key: 'revenue' | 'orders') =>
      list.reduce((acc, row) => acc + row[key], 0)

    return {
      currentRevenue: sum(currentSlice, 'revenue'),
      previousRevenue: sum(previousSlice, 'revenue'),
      currentOrders: sum(currentSlice, 'orders'),
      previousOrders: sum(previousSlice, 'orders'),
    }
  }, [salesTrendData])

  const rolling30Summary = useMemo(() => {
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(now.getDate() - 29)
    currentStart.setHours(0, 0, 0, 0)

    const previousStart = new Date(currentStart)
    previousStart.setDate(currentStart.getDate() - 30)

    let currentRevenue = 0
    let previousRevenue = 0
    let currentOrders = 0
    let previousOrders = 0
    let currentCompletedOrders = 0

    allOrders.forEach((order) => {
      const createdAt = new Date(order.createdAt)
      const total = Number(order.totalPrice)

      if (createdAt >= currentStart) {
        currentRevenue += total
        currentOrders += 1
        if (order.status === 'COMPLETED') {
          currentCompletedOrders += 1
        }
      } else if (createdAt >= previousStart && createdAt < currentStart) {
        previousRevenue += total
        previousOrders += 1
      }
    })

    return {
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      currentCompletedOrders,
    }
  }, [allOrders])

  const avgOrdersPerStaff = useMemo(() => {
    const staffCount = performance?.byStaff.length ?? 0
    if (staffCount === 0) return 0
    return Number((totalOrders / staffCount).toFixed(1))
  }, [performance?.byStaff.length, totalOrders])

  const workloadIsHigh = avgOrdersPerStaff > KPI_WORKLOAD_TARGET
  const completionRate = Number(performance?.summary.completionRate ?? 0)

  const trendInsight = useMemo(() => {
    if (salesTrendData.length === 0) {
      return 'No trend data available for the selected range.'
    }

    if (trendMetric === 'both') {
      const revenuePoints = salesTrendData.map((point) => ({
        label: point.label,
        value: Number(point.revenue || 0),
      }))
      const orderPoints = salesTrendData.map((point) => ({
        label: point.label,
        value: Number(point.orders || 0),
      }))
      const peakRevenue = revenuePoints.reduce((best, current) => (current.value > best.value ? current : best), revenuePoints[0])
      const peakOrders = orderPoints.reduce((best, current) => (current.value > best.value ? current : best), orderPoints[0])
      return `Peak revenue: ${peakRevenue.label} ($${peakRevenue.value.toFixed(2)}). Peak orders: ${peakOrders.label} (${peakOrders.value}).`
    }

    const metricKey = trendMetric === 'revenue' ? 'revenue' : 'orders'
    const points = salesTrendData.map((point) => ({
      label: point.label,
      value: Number(point[metricKey] || 0),
    }))

    const peak = points.reduce((best, current) => (current.value > best.value ? current : best), points[0])
    const low = points.reduce((best, current) => (current.value < best.value ? current : best), points[0])

    if (trendMetric === 'revenue') {
      return `Revenue peaked on ${peak.label} ($${peak.value.toFixed(2)}). Lowest on ${low.label} ($${low.value.toFixed(2)}).`
    }

    return `Orders peaked on ${peak.label} (${peak.value}). Lowest on ${low.label} (${low.value}).`
  }, [salesTrendData, trendMetric])

  const trendMetricLabel = trendMetric === 'revenue' ? 'Revenue' : trendMetric === 'orders' ? 'Orders' : 'Both'

  const primaryQuickAction =
    restockCandidates.length > 10
      ? {
          label: 'Restock Inventory',
          to: '/admin/books',
          icon: <AlertTriangle className="h-4 w-4" />,
        }
      : pendingOrders > 10
        ? {
            label: 'Process Orders',
            to: '/admin/orders?status=PENDING',
            icon: <Package className="h-4 w-4" />,
          }
        : null

  if (booksLoading || ordersLoading || usersLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 dark:text-slate-100 space-y-6">
        <Skeleton variant="logo" className="h-12 w-12" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="surface-canvas min-h-screen px-4 py-8 dark:text-slate-100 sm:px-6"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="section-kicker">Executive Overview</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Manage your bookstore from a single command center.</p>
        </div>

        <div className="surface-subtle mb-8 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightItem text={`Revenue ${trendLabel(rolling30Summary.currentRevenue, rolling30Summary.previousRevenue).label} this month`} />
          <InsightItem text={`${outOfStockBooks.length} books out of stock`} tone="danger" />
          <InsightItem text={`Staff workload ${workloadIsHigh ? 'above optimal' : 'within target'}`} tone={workloadIsHigh ? 'warning' : 'neutral'} />
          <InsightItem text={`${pendingOrders} pending orders`} tone={pendingOrders > 10 ? 'warning' : 'neutral'} />
        </div>

        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-semibold">Business Health</h2>
            <p className="text-xs uppercase tracking-widest text-slate-500">Commercial performance</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card
              label="Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              hint={`${rolling30Summary.currentCompletedOrders} completed orders (last 30 days)`}
              trendLabel={`${trendLabel(rolling30Summary.currentRevenue, rolling30Summary.previousRevenue).label} vs last 30 days`}
              trendClassName={trendLabel(rolling30Summary.currentRevenue, rolling30Summary.previousRevenue).className}
              icon={<DollarSign className="h-7 w-7" />}
              href="/admin/orders"
            />
            <Card
              label="Orders"
              value={totalOrders}
              hint={`${pendingOrders} pending orders`}
              trendLabel={`${trendLabel(rolling30Summary.currentOrders, rolling30Summary.previousOrders).label} vs last 30 days`}
              trendClassName={trendLabel(rolling30Summary.currentOrders, rolling30Summary.previousOrders).className}
              icon={<Package className="h-7 w-7" />}
              href="/admin/orders"
            />
            <Card
              label="Avg Order Value"
              value={`$${avgOrderValue.toFixed(2)}`}
              hint="Revenue per order"
              trendLabel="Executive efficiency signal"
              icon={<TrendingUp className="h-7 w-7" />}
              href="/admin/orders"
            />
            <Card
              label="Users"
              value={totalUsers}
              hint="Registered accounts"
              trendLabel={`${trendLabel(totalUsers, Math.max(1, totalUsers - 4)).label} vs baseline`}
              trendClassName={trendLabel(totalUsers, Math.max(1, totalUsers - 4)).className}
              icon={<Users className="h-7 w-7" />}
              href="/admin/users"
            />
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-semibold">Operations</h2>
            <p className="text-xs uppercase tracking-widest text-slate-500">Execution and risk</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            <Card
              label="Out of Stock"
              value={outOfStockBooks.length}
              hint="Immediate restock needed"
              trendLabel="Critical inventory risk"
              icon={<AlertTriangle className="h-7 w-7" />}
              valueClassName="text-rose-600 dark:text-rose-300"
              href="/admin/books"
            />
            <Card
              label="Low Stock"
              value={lowStockBooks.length}
              hint="2-10 units remaining"
              trendLabel="Restock planning queue"
              icon={<BookOpen className="h-7 w-7" />}
              valueClassName="text-orange-600 dark:text-amber-300"
              href="/admin/books"
            />
            <Card
              label="Pending Orders"
              value={pendingOrders}
              hint="Awaiting processing"
              trendLabel={pendingOrders > 10 ? '⚠ High queue pressure' : 'Queue within acceptable range'}
              icon={<Package className="h-7 w-7" />}
              valueClassName={pendingOrders > 10 ? 'text-orange-600 dark:text-amber-300' : undefined}
              href="/admin/orders?status=PENDING"
            />
            <Card
              label="Orders / Staff"
              value={avgOrdersPerStaff}
              hint="orders per staff (avg)"
              trendLabel={workloadIsHigh ? `High workload ⚠ above target ${KPI_WORKLOAD_TARGET}` : `Healthy workload (target ${KPI_WORKLOAD_TARGET})`}
              trendClassName={workloadIsHigh ? 'text-orange-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}
              icon={<TrendingUp className="h-7 w-7" />}
              href="/admin/staff/performance"
            />
            <Card
              label="Task Completion"
              value={`${completionRate.toFixed(2)}%`}
              hint={`Goal: ${KPI_COMPLETION_TARGET}%`}
              trendLabel={`${performance?.summary.completedTasks ?? 0} completed tasks`}
              trendClassName={
                completionRate < KPI_COMPLETION_TARGET
                  ? 'text-orange-600 dark:text-amber-300'
                  : 'text-emerald-600 dark:text-emerald-300'
              }
              icon={<CheckSquare className="h-7 w-7" />}
              valueClassName={completionRate < KPI_COMPLETION_TARGET ? 'text-orange-600 dark:text-amber-300' : undefined}
              href="/admin/staff/tasks"
            />
          </div>
        </section>

        <div className="surface-subtle mb-8 border-rose-300/55 bg-rose-50/85 p-6 dark:border-rose-700/50 dark:bg-rose-950/35">
          <h3 className="text-lg font-semibold text-red-900 dark:text-rose-200">Restocking Summary</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-rose-200">
            {restockCandidates.length} item(s) need restocking: {outOfStockBooks.length} out of stock and {lowStockBooks.length} low stock.
          </p>
        </div>

        <div className="surface-panel ui-fade-up mb-8 p-6">
          <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Sales Trend</h2>
              <p className="mt-1 text-sm text-slate-500">{trendInsight}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div ref={metricMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMetricMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Metric: {trendMetricLabel}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMetricMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isMetricMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute right-0 top-11 z-20 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    >
                      {[
                        { value: 'revenue' as TrendMetric, label: 'Revenue', description: 'Track sales value' },
                        { value: 'orders' as TrendMetric, label: 'Orders', description: 'Track order volume' },
                        { value: 'both' as TrendMetric, label: 'Both', description: 'Overlay revenue + orders' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setTrendMetric(option.value)
                            setIsMetricMenuOpen(false)
                          }}
                          className={`block w-full rounded-lg px-3 py-2 text-left transition-colors ${
                            trendMetric === option.value
                              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider">{option.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{option.description}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800 overflow-hidden">
                {(['7d', '30d', '12m'] as TrendRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTrendRange(range)}
                    className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full ${trendRange === range ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-500 dark:text-slate-300'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="surface-subtle p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">{trendRange} Revenue</p>
              <p className="mt-1 text-xl font-bold">${trendSummary.currentRevenue.toFixed(2)}</p>
              <p className={`text-xs ${trendLabel(trendSummary.currentRevenue, trendSummary.previousRevenue).className}`}>
                {trendLabel(trendSummary.currentRevenue, trendSummary.previousRevenue).label} vs previous period
              </p>
            </div>
            <div className="surface-subtle p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">{trendRange} Orders</p>
              <p className="mt-1 text-xl font-bold">{trendSummary.currentOrders}</p>
              <p className={`text-xs ${trendLabel(trendSummary.currentOrders, trendSummary.previousOrders).className}`}>
                {trendLabel(trendSummary.currentOrders, trendSummary.previousOrders).label} vs previous period
              </p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={
                    trendMetric === 'orders'
                      ? (value: number | string) => `${value}`
                      : (value: number | string) => formatCompactCurrency(Number(value))
                  }
                />
                {trendMetric === 'both' && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />}
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'revenue') return [`$${Number(value).toFixed(2)}`, 'Revenue']
                    return [Number(value), 'Orders']
                  }}
                />
                {(trendMetric === 'revenue' || trendMetric === 'both') && (
                  <Area
                    type="monotone"
                    yAxisId="left"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fill="url(#revenueFill)"
                    strokeWidth={2}
                  />
                )}
                {(trendMetric === 'orders' || trendMetric === 'both') && (
                  <Area
                    type="monotone"
                    yAxisId={trendMetric === 'both' ? 'right' : 'left'}
                    dataKey="orders"
                    stroke="#f59e0b"
                    fill="url(#ordersFill)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-panel ui-fade-up mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {primaryQuickAction ? (
              <Link to={primaryQuickAction.to} className="w-full">
                <Button className="w-full flex items-center justify-center gap-2" size="lg">
                  {primaryQuickAction.icon}
                  {primaryQuickAction.label}
                </Button>
              </Link>
            ) : (
              <Button className="w-full flex items-center justify-center gap-2" size="lg" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add New Book
              </Button>
            )}
            <Link to="/admin/orders" className="w-full">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2" size="lg">
                <Package className="h-4 w-4" />
                Manage Orders
              </Button>
            </Link>
            <Link to="/admin/staff/performance" className="w-full">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2" size="lg">
                <CheckSquare className="h-4 w-4" />
                Staff Performance
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="surface-panel ui-fade-up p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Recent Orders</h2>
              <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm dark:text-amber-300 dark:hover:text-amber-200">View All →</Link>
            </div>
            <p className="mb-4 text-sm text-slate-500">{todayOrders.length} orders today - ${todayRevenue.toFixed(2)} revenue</p>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8 dark:text-slate-400">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    to={`/admin/orders?orderId=${encodeURIComponent(order.id)}`}
                    key={order.id}
                    className="surface-subtle flex items-center justify-between p-3 transition-colors hover:bg-white/95 dark:hover:bg-slate-800/75"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">Order #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right mr-3">
                      <p className="font-semibold text-sm">${Number(order.totalPrice).toFixed(2)}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500">{order.orderItems.length} items</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="surface-panel ui-fade-up p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Low Stock Alerts</h2>
              <Link to="/admin/books" className="text-primary-600 hover:text-primary-700 text-sm dark:text-amber-300 dark:hover:text-amber-200">View All →</Link>
            </div>
            {restockCandidates.length === 0 ? (
              <p className="text-gray-500 text-center py-8 dark:text-slate-400">All books well stocked!</p>
            ) : (
              <div className="space-y-3">
                {restockCandidates.slice(0, 5).map((book) => {
                  const severity = getStockSeverity(book.stock)
                  return (
                    <div key={book.id} className="surface-subtle flex items-center justify-between gap-3 p-3 transition-colors hover:bg-white/95 dark:hover:bg-slate-800/75">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{book.title}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-slate-500">{book.author}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severity.className}`}>
                        {severity.label}
                      </span>
                      <Link to={`/admin/books?bookId=${encodeURIComponent(book.id)}`}>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold transition-colors hover:border-amber-300 hover:text-amber-400 dark:border-slate-700"
                        >
                          + Restock
                        </button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <BookFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={() => setIsModalOpen(false)} />
    </motion.div>
  )
}

type CardProps = {
  label: string
  value: string | number
  hint: string
  trendLabel: string
  icon: React.ReactNode
  valueClassName?: string
  trendClassName?: string
  href?: string
}

const Card = ({ label, value, hint, trendLabel, icon, valueClassName, trendClassName, href }: CardProps) => {
  const content = (
    <div className="surface-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 mb-1 dark:text-slate-400">{label}</p>
          <p className={`truncate text-[2rem] font-bold leading-tight text-gray-900 dark:text-slate-100 ${valueClassName || ''}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1 dark:text-slate-500">{hint}</p>
          <p className={`text-xs mt-1 ${trendClassName || 'text-slate-500'}`}>{trendLabel}</p>
        </div>
        <div className="shrink-0 text-gray-400 dark:text-slate-500">{icon}</div>
      </div>
    </div>
  )

  if (!href) return content
  return <Link to={href}>{content}</Link>
}

const trendLabel = (current: number, previous: number): { label: string; className: string } => {
  if (previous === 0 && current === 0) {
    return { label: '→ 0.0%', className: 'text-slate-500' }
  }

  if (previous === 0) {
    return { label: '↑ 100.0%', className: 'text-emerald-600 dark:text-emerald-300' }
  }

  const delta = ((current - previous) / previous) * 100
  if (delta > 0) {
    return { label: `↑ ${delta.toFixed(1)}%`, className: 'text-emerald-600 dark:text-emerald-300' }
  }
  if (delta < 0) {
    return { label: `↓ ${Math.abs(delta).toFixed(1)}%`, className: 'text-rose-600 dark:text-rose-300' }
  }

  return { label: '→ 0.0%', className: 'text-slate-500' }
}

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}m`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${value.toFixed(0)}`
}

const getStockSeverity = (stock: number): { label: string; className: string } => {
  if (stock <= 1) {
    return {
      label: `${stock} left - Critical`,
      className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
    }
  }

  if (stock <= 5) {
    return {
      label: `${stock} left - High`,
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    }
  }

  return {
    label: `${stock} left - Watch`,
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  }
}

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const tone =
    status === 'COMPLETED'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      : status === 'PENDING'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
        : status === 'CANCELLED'
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{status}</span>
}

const InsightItem = ({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'warning' | 'danger' }) => {
  const toneClassName =
    tone === 'danger'
      ? 'border-rose-300/60 text-rose-700 dark:border-rose-700/50 dark:text-rose-200'
      : tone === 'warning'
        ? 'border-amber-300/60 text-amber-700 dark:border-amber-700/50 dark:text-amber-200'
        : 'border-slate-300/60 text-slate-700 dark:border-slate-700/50 dark:text-slate-300'

  return <div className={`rounded-xl border bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70 ${toneClassName}`}>{text}</div>
}

export default AdminPage
