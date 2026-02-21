import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useDepartments, useStaffPerformance } from '@/services/staff'

const GOALS_KEY = 'staff-performance-goals-v1'

const DEPARTMENT_COLOR_BY_CODE: Record<string, { primary: string; soft: string; muted: string }> = {
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

const AdminPerformancePage = () => {
  const user = useAuthStore((state) => state.user)
  const canViewDepartments =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'staff.view')
  const [departmentId, setDepartmentId] = useState('')
  const [goals, setGoals] = useState<Record<string, number>>({})

  const { data: departments = [] } = useDepartments({ enabled: canViewDepartments })
  const { data: performance } = useStaffPerformance({
    departmentId: departmentId || undefined,
  })

  const departmentIdByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const department of departments) {
      map.set(department.name, department.id)
    }
    return map
  }, [departments])

  const toneByDepartmentId = useMemo(() => {
    const map = new Map<string, { primary: string; soft: string; muted: string }>()
    for (const department of departments) {
      const code = (department.code || '').toUpperCase()
      map.set(department.id, DEPARTMENT_COLOR_BY_CODE[code] ?? DEPARTMENT_COLOR_BY_CODE.DEFAULT)
    }
    return map
  }, [departments])

  const selectedTone = departmentId
    ? toneByDepartmentId.get(departmentId) ?? DEPARTMENT_COLOR_BY_CODE.DEFAULT
    : { primary: '#334155', soft: '#e2e8f0', muted: '#94a3b8' }

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
      const tone = toneByDepartmentId.get(entry.departmentId) ?? DEPARTMENT_COLOR_BY_CODE.DEFAULT
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
                    const tone = toneByDepartmentId.get(entry.departmentId) ?? DEPARTMENT_COLOR_BY_CODE.DEFAULT
                    return <Cell key={`completed-${entry.name}`} fill={tone.primary} />
                  })}
                </Bar>
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {staffChartData.map((entry) => {
                    const tone = toneByDepartmentId.get(entry.departmentId) ?? DEPARTMENT_COLOR_BY_CODE.DEFAULT
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
                  data={departmentId ? statusData : departmentPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  fill={selectedTone.primary}
                  label
                >
                  {(departmentId ? statusData : departmentPieData).map((entry, index) => {
                    const fill = departmentId
                      ? STATUS_COLOR[String(entry.name).toUpperCase()] ?? selectedTone.primary
                      : String((entry as { fill?: string }).fill || selectedTone.primary)
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
            const progress = Math.min(100, Math.round((entry.completionRate / goal) * 100))
            const tone = toneByDepartmentId.get(entry.departmentId) ?? DEPARTMENT_COLOR_BY_CODE.DEFAULT
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
  tone: { primary: string; soft: string }
}) => (
  <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900" style={{ borderColor: tone.soft }}>
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold" style={{ color: tone.primary }}>{value}</p>
  </div>
)

export default AdminPerformancePage
