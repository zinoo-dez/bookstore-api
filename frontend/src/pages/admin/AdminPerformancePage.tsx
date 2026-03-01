import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useCommercialPerformance, useDepartments, useStaffPerformance } from '@/services/staff'

type Tone = { primary: string; soft: string; muted: string }
type CommercialWindow = '7d' | '30d' | '90d' | 'all'
type CommercialLeaderboardRow = {
  id: string
  title: string
  subtitle: string
  right: string
  detail: string
}

const GOALS_KEY = 'staff-performance-goals-v1'
const DEFAULT_TONE: Tone = { primary: '#7c3aed', soft: '#ede9fe', muted: '#c4b5fd' }
const ALL_DEPARTMENTS_TONE: Tone = { primary: '#334155', soft: '#e2e8f0', muted: '#94a3b8' }

const DEPARTMENT_COLOR_BY_CODE: Record<string, Tone> = {
  CS: { primary: '#2563eb', soft: '#dbeafe', muted: '#93c5fd' },
  HR: { primary: '#0f766e', soft: '#ccfbf1', muted: '#5eead4' },
  FIN: { primary: '#b45309', soft: '#ffedd5', muted: '#fdba74' },
  FINANCE: { primary: '#b45309', soft: '#ffedd5', muted: '#fdba74' },
  WH: { primary: '#4f46e5', soft: '#e0e7ff', muted: '#a5b4fc' },
  WAREHOUSE: { primary: '#4f46e5', soft: '#e0e7ff', muted: '#a5b4fc' },
  LEGAL: { primary: '#475569', soft: '#e2e8f0', muted: '#94a3b8' },
  DEFAULT: { primary: '#7c3aed', soft: '#ede9fe', muted: '#c4b5fd' },
}

const STATUS_COLOR: Record<string, string> = {
  TODO: '#64748b',
  IN_PROGRESS: '#2563eb',
  BLOCKED: '#b45309',
  COMPLETED: '#0f766e',
}

const getFromDateByCommercialWindow = (window: CommercialWindow): string | undefined => {
  if (window === 'all') return undefined
  const now = new Date()
  const days = window === '7d' ? 7 : window === '30d' ? 30 : 90
  now.setDate(now.getDate() - days)
  return now.toISOString()
}

const getGoalProgress = (completionRate: number, goal: number): number =>
  Math.min(100, Math.round((completionRate / goal) * 100))

const getPieCellFill = (
  entry: { name: string; fill?: string },
  selectedDepartmentId: string,
  selectedTone: Tone,
): string => {
  if (selectedDepartmentId) {
    return STATUS_COLOR[entry.name.toUpperCase()] ?? selectedTone.primary
  }
  return entry.fill ?? selectedTone.primary
}

const AdminPerformancePage = () => {
  const user = useAuthStore((state) => state.user)
  const canViewDepartments =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'staff.view')
  const canViewCommercial =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'finance.reports.view')
  const [departmentId, setDepartmentId] = useState('')
  const [goals, setGoals] = useState<Record<string, number>>({})
  const [commercialWindow, setCommercialWindow] = useState<CommercialWindow>('30d')

  const { data: departments = [] } = useDepartments({ enabled: canViewDepartments })
  const { data: performance } = useStaffPerformance({
    departmentId: departmentId || undefined,
  })
  const commercialFromDate = useMemo(
    () => getFromDateByCommercialWindow(commercialWindow),
    [commercialWindow],
  )
  const { data: commercialPerformance } = useCommercialPerformance({
    fromDate: commercialFromDate,
    limit: 5,
  }, {
    enabled: canViewCommercial,
  })

  const departmentIdByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const department of departments) {
      map.set(department.name, department.id)
    }
    return map
  }, [departments])

  const toneByDepartmentId = useMemo(() => {
    const map = new Map<string, Tone>()
    for (const department of departments) {
      const code = (department.code || '').toUpperCase()
      map.set(department.id, DEPARTMENT_COLOR_BY_CODE[code] ?? DEFAULT_TONE)
    }
    return map
  }, [departments])

  const selectedTone = departmentId
    ? toneByDepartmentId.get(departmentId) ?? DEFAULT_TONE
    : ALL_DEPARTMENTS_TONE

  useEffect(() => {
    const raw = localStorage.getItem(GOALS_KEY)
    if (!raw) return
    try {
      setGoals(JSON.parse(raw) as Record<string, number>)
    } catch {
      setGoals({})
    }
  }, [])

  const updateGoal = (deptId: string, target: number) => {
    const next = { ...goals, [deptId]: target }
    setGoals(next)
    localStorage.setItem(GOALS_KEY, JSON.stringify(next))
  }

  const statusData = useMemo(() => {
    const counts = performance?.summary.statusCounts || {}
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [performance?.summary.statusCounts])

  const staffChartData = useMemo(() => {
    return (performance?.byStaff || [])
      .slice(0, 10)
      .map((item) => ({
        name: item.name.length > 12 ? `${item.name.slice(0, 12)}...` : item.name,
        completed: item.completed,
        total: item.total,
        departmentId: departmentIdByName.get(item.departmentName) ?? '',
      }))
  }, [departmentIdByName, performance?.byStaff])

  const departmentPieData = useMemo(() => {
    return (performance?.byDepartment || []).map((entry) => {
      const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
      return {
        name: entry.departmentName,
        value: entry.total,
        fill: tone.primary,
      }
    })
  }, [performance?.byDepartment, toneByDepartmentId])

  const avgCompletionByDepartment = useMemo(() => {
    const list = performance?.byDepartment || []
    if (list.length === 0) return 0
    return Math.round(list.reduce((sum, row) => sum + row.completionRate, 0) / list.length)
  }, [performance?.byDepartment])
  const selectedPieData = departmentId ? statusData : departmentPieData

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
      </div>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Filters</h2>
        {canViewDepartments ? (
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="mt-3 rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Department filter unavailable for your permission scope.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Metric title="Total Tasks" value={performance?.summary.totalTasks ?? 0} tone={selectedTone} />
        <Metric title="Completed" value={performance?.summary.completedTasks ?? 0} tone={selectedTone} />
        <Metric title="Completion Rate" value={`${performance?.summary.completionRate ?? 0}%`} tone={selectedTone} />
        <Metric title="Avg Dept Rate" value={`${avgCompletionByDepartment}%`} tone={selectedTone} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Top Staff Throughput</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" radius={[6, 6, 0, 0]}>
                  {staffChartData.map((entry) => {
                    const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
                    return <Cell key={`completed-${entry.name}`} fill={tone.primary} />
                  })}
                </Bar>
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {staffChartData.map((entry) => {
                    const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
                    return <Cell key={`total-${entry.name}`} fill={tone.muted} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            {departmentId ? 'Task Status Mix' : 'Department Workload Mix'}
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={selectedPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  fill={selectedTone.primary}
                  label
                >
                  {selectedPieData.map((entry, index) => {
                    const fillFromEntry =
                      typeof (entry as { fill?: unknown }).fill === 'string'
                        ? (entry as { fill?: string }).fill
                        : undefined
                    const fill = getPieCellFill(
                      { name: String(entry.name), fill: fillFromEntry },
                      departmentId,
                      selectedTone,
                    )
                    return <Cell key={`pie-cell-${index}`} fill={fill} />
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Department Goals</h2>
        <p className="mt-1 text-xs text-slate-500">Set target completion % for each department and track progress.</p>
        <div className="mt-4 space-y-4">
          {(performance?.byDepartment || []).map((entry) => {
            const goal = goals[entry.departmentId] ?? 85
            const progress = getGoalProgress(entry.completionRate, goal)
            const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
            return (
              <div key={entry.departmentId} className="rounded-lg border p-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{entry.departmentName}</p>
                    <p className="text-xs text-slate-500">Current: {entry.completionRate}% • Goal: {goal}%</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={goal}
                    onChange={(e) => updateGoal(entry.departmentId, Number(e.target.value) || 1)}
                    className="w-24 rounded border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-2 rounded-full" style={{ width: `${progress}%`, backgroundColor: tone.primary }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {canViewCommercial && (
        <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef4ff_55%,#f1f5f9_100%)] p-5 text-slate-800 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#0f172a_100%)] dark:text-slate-100 dark:shadow-[0_20px_45px_rgba(15,23,42,0.24)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Commercial Performance</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Top buyers and best sellers from confirmed/completed orders.</p>
            </div>
            <select
              value={commercialWindow}
              onChange={(event) => setCommercialWindow(event.target.value as typeof commercialWindow)}
              className="rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-800 dark:border-slate-500/60 dark:bg-slate-900/70 dark:text-slate-100"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <CommercialMetric title="Buyers Ranked" value={commercialPerformance?.summary.buyersCount ?? 0} />
            <CommercialMetric title="Books Ranked" value={commercialPerformance?.summary.booksTracked ?? 0} />
            <CommercialMetric title="Orders" value={commercialPerformance?.summary.totalOrders ?? 0} />
            <CommercialMetric
              valueClassName="text-emerald-300"
              title="Revenue"
              value={`$${Number(commercialPerformance?.summary.totalRevenue ?? 0).toFixed(2)}`}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <CommercialLeaderboard
              title="Top Buyers"
              rows={(commercialPerformance?.topBuyers ?? []).map((row) => ({
                id: row.userId,
                title: row.name,
                subtitle: row.email,
                right: `$${row.totalSpend.toFixed(2)}`,
                detail: `${row.orderCount} order(s)`,
              }))}
            />
            <CommercialLeaderboard
              title="Top Books by Units"
              rows={(commercialPerformance?.topBooksByUnits ?? []).map((row) => ({
                id: row.bookId,
                title: row.title,
                subtitle: row.author || row.isbn,
                right: `${row.units} units`,
                detail: `$${row.revenue.toFixed(2)}`,
              }))}
            />
            <CommercialLeaderboard
              title="Top Books by Revenue"
              rows={(commercialPerformance?.topBooksByRevenue ?? []).map((row) => ({
                id: row.bookId,
                title: row.title,
                subtitle: row.author || row.isbn,
                right: `$${row.revenue.toFixed(2)}`,
                detail: `${row.units} units`,
              }))}
            />
          </div>
        </section>
      )}
    </div>
  )
}

const Metric = ({
  title,
  value,
  tone,
}: {
  title: string
  value: string | number
  tone: Pick<Tone, 'primary' | 'soft'>
}) => (
  <div
    className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    style={{ borderColor: tone.soft }}
  >
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold" style={{ color: tone.primary }}>
      {value}
    </p>
  </div>
)

const CommercialMetric = ({
  title,
  value,
  valueClassName = 'text-slate-900 dark:text-slate-100',
}: {
  title: string
  value: string | number
  valueClassName?: string
}) => (
  <div className="rounded-xl border border-slate-300 bg-white/70 px-4 py-3 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/50">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{title}</p>
    <p className={`mt-1 text-2xl font-bold ${valueClassName}`}>{value}</p>
  </div>
)

const CommercialLeaderboard = ({
  title,
  rows,
}: {
  title: string
  rows: CommercialLeaderboardRow[]
}) => (
  <div className="rounded-2xl border border-slate-300 bg-white/65 p-3 dark:border-slate-700/70 dark:bg-slate-900/40">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{title}</p>
    <div className="mt-3 space-y-2">
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No data for selected period.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {rows.slice(0, 3).map((row, index) => (
              <div
                key={row.id}
                className={`rounded-xl border px-2 py-3 text-center ${
                  index === 0
                    ? 'border-amber-300 bg-amber-100/65 dark:border-amber-300/70 dark:bg-amber-200/20'
                    : index === 1
                      ? 'border-slate-300 bg-slate-100/80 dark:border-slate-300/60 dark:bg-slate-300/10'
                      : 'border-orange-300 bg-orange-100/70 dark:border-orange-300/60 dark:bg-orange-300/10'
                }`}
              >
                <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-600 dark:text-slate-200">#{index + 1}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{row.title}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-300">{row.subtitle}</p>
                <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">{row.right}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            {rows.slice(3).map((row, index) => (
              <div
                key={row.id}
                className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">#{index + 4}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.right}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {rows.length <= 3 ? (
            <div className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
              Top {rows.length} entries in selected window.
            </div>
          ) : null}
        </>
      )}
    </div>
  </div>
)

export default AdminPerformancePage
