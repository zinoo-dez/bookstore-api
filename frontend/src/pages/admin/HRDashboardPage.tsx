import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useStaffPerformance, useStaffProfiles, useTasks } from '@/services/staff'
import Skeleton from '@/components/ui/Skeleton'

const HRDashboardPage = () => {
  const { data: staffProfiles = [], isLoading: staffLoading } = useStaffProfiles()
  const { data: tasks = [], isLoading: taskLoading } = useTasks()
  const { data: performance, isLoading: perfLoading } = useStaffPerformance()

  const isLoading = staffLoading || taskLoading || perfLoading

  const activeStaff = staffProfiles.filter((profile) => profile.status === 'ACTIVE').length
  const staffNeedingReview = staffProfiles.filter((profile) => profile.status !== 'ACTIVE').length
  const openTasks = tasks.filter((task) => task.status !== 'COMPLETED').length
  const overdueTasks = tasks.filter((task) => {
    if (task.status === 'COMPLETED') return false
    const deadline = (task.metadata as { deadline?: string } | null)?.deadline
    if (!deadline) return false
    return new Date(deadline).getTime() < Date.now()
  }).length
  const avgPerformance = performance?.summary.completionRate ?? 0

  const alerts = useMemo(() => {
    const items: string[] = []
    if (staffNeedingReview > 0) items.push(`${staffNeedingReview} staff need profile/status review`)
    if (overdueTasks > 0) items.push(`${overdueTasks} tasks are overdue`)
    if (openTasks > 10) items.push(`${openTasks} tasks are still open in queue`)
    if (items.length === 0) items.push('No critical HR alerts right now')
    return items
  }, [staffNeedingReview, overdueTasks, openTasks])

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 dark:text-slate-100">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 dark:text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">HR Workspace</p>
        <h1 className="text-3xl font-bold">HR Command Center</h1>
        <p className="text-slate-500 mt-2">Prioritized workforce insights and actions for your department.</p>
      </div>

      <div className="rounded-2xl border border-amber-300/40 bg-amber-50/80 p-4 dark:border-amber-700/40 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Smart Alerts</p>
            {alerts.map((alert) => (
              <p key={alert} className="text-sm text-amber-800 dark:text-amber-200">{alert}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Staff" value={staffProfiles.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Active Staff" value={activeStaff} icon={<CheckCircle2 className="h-5 w-5" />} valueClassName="text-emerald-600 dark:text-emerald-300" />
        <StatCard title="Need Review" value={staffNeedingReview} icon={<AlertTriangle className="h-5 w-5" />} valueClassName="text-rose-600 dark:text-rose-300" />
        <StatCard title="Open Tasks" value={openTasks} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard title="Overdue" value={overdueTasks} icon={<Clock3 className="h-5 w-5" />} valueClassName="text-rose-600 dark:text-rose-300" />
        <StatCard title="Avg Score" value={`${avgPerformance}%`} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Quick Actions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link to="/admin/staff" className="rounded-lg border px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            Review Staff Directory
          </Link>
          <Link to="/admin/staff/tasks" className="rounded-lg border px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            Open Task Queue
          </Link>
          <Link to="/admin/staff/performance" className="rounded-lg border px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            Analyze Performance
          </Link>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({
  title,
  value,
  icon,
  valueClassName = '',
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  valueClassName?: string
}) => (
  <div className="rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
    </div>
    <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
  </div>
)

export default HRDashboardPage

