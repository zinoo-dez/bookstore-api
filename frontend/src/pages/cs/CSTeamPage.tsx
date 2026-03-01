import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  UsersRound,
} from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { useDepartments, useStaffProfiles, type StaffStatus } from '@/services/staff'
import { useInquiries, useInquiryOverview } from '@/services/inquiries'
import { useAuthStore } from '@/store/auth.store'

const statusOptions: Array<{ value: '' | StaffStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On leave' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const getStatusTone = (status: StaffStatus) => {
  if (status === 'ACTIVE') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
  }
  if (status === 'ON_LEAVE') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200'
  }
  return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

const CSTeamPage = () => {
  const user = useAuthStore((state) => state.user)
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | StaffStatus>('')
  const [search, setSearch] = useState('')
  const [showMemberRoster, setShowMemberRoster] = useState(false)

  const {
    data: departments = [],
    error: departmentsError,
    isLoading: departmentsLoading,
  } = useDepartments({ enabled: true })

  const {
    data: staffProfiles = [],
    error: staffError,
    isLoading: staffLoading,
  } = useStaffProfiles(
    {
      departmentId: departmentFilter || undefined,
      status: statusFilter || undefined,
    },
    { enabled: true },
  )

  const { data: overview, isLoading: overviewLoading } = useInquiryOverview(undefined, true)
  const { data: escalations, isLoading: escalationsLoading } = useInquiries(
    { status: 'ESCALATED', page: 1, limit: 1 },
    true,
  )

  const queueTotals = overview?.totals
  const escalatedCount = escalations?.total ?? 0
  const now = new Date()
  const currentHour = now.getHours()
  const isCoverageWindow = currentHour >= 8 && currentHour < 22

  const filteredStaff = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return staffProfiles.filter((profile) => {
      if (!keyword) return true
      return (
        profile.user.name.toLowerCase().includes(keyword) ||
        profile.user.email.toLowerCase().includes(keyword) ||
        profile.title.toLowerCase().includes(keyword) ||
        profile.department.name.toLowerCase().includes(keyword)
      )
    })
  }, [search, staffProfiles])

  const performanceByEmail = useMemo(() => {
    const map = new Map<
      string,
      { solvedCount: number; activeCount: number; assignedTotal: number }
    >()
    for (const item of overview?.staffPerformance ?? []) {
      map.set(item.staffEmail.toLowerCase(), {
        solvedCount: item.solvedCount,
        activeCount: item.activeCount,
        assignedTotal: item.assignedTotal,
      })
    }
    return map
  }, [overview?.staffPerformance])

  const podSummary = useMemo(() => {
    const grouped = new Map<
      string,
      { departmentId: string; departmentName: string; members: number; active: number; onLeave: number }
    >()
    for (const profile of filteredStaff) {
      const key = profile.departmentId
      const current = grouped.get(key) ?? {
        departmentId: profile.departmentId,
        departmentName: profile.department.name,
        members: 0,
        active: 0,
        onLeave: 0,
      }
      current.members += 1
      if (profile.status === 'ACTIVE') current.active += 1
      if (profile.status === 'ON_LEAVE') current.onLeave += 1
      grouped.set(key, current)
    }
    return Array.from(grouped.values()).sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName),
    )
  }, [filteredStaff])

  const podLoadSummary = useMemo(() => {
    const grouped = new Map<
      string,
      {
        departmentId: string
        departmentName: string
        members: number
        active: number
        onLeave: number
        assignedTotal: number
        solvedCount: number
      }
    >()

    for (const profile of filteredStaff) {
      const perf = performanceByEmail.get(profile.user.email.toLowerCase())
      const current = grouped.get(profile.departmentId) ?? {
        departmentId: profile.departmentId,
        departmentName: profile.department.name,
        members: 0,
        active: 0,
        onLeave: 0,
        assignedTotal: 0,
        solvedCount: 0,
      }
      current.members += 1
      if (profile.status === 'ACTIVE') current.active += 1
      if (profile.status === 'ON_LEAVE') current.onLeave += 1
      current.assignedTotal += perf?.assignedTotal ?? perf?.activeCount ?? 0
      current.solvedCount += perf?.solvedCount ?? 0
      grouped.set(profile.departmentId, current)
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName),
    )
  }, [filteredStaff, performanceByEmail])

  const activeMembers = filteredStaff.filter((item) => item.status === 'ACTIVE').length
  const onLeaveMembers = filteredStaff.filter((item) => item.status === 'ON_LEAVE').length
  const inactiveMembers = filteredStaff.filter((item) => item.status === 'INACTIVE').length

  const hasDataErrors = Boolean(departmentsError) || Boolean(staffError)

  return (
    <div className="space-y-8">
      <section className="luxe-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              Customer Service
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Team Operations
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Monitor staffing coverage, ownership load, and queue pressure across service pods.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            <Clock3 className="h-3.5 w-3.5" />
            {isCoverageWindow ? 'Coverage window active' : 'After-hours monitoring'}
          </div>
        </div>
      </section>

      {hasDataErrors && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {departmentsError && <p>{getErrorMessage(departmentsError)}</p>}
          {staffError && <p>{getErrorMessage(staffError)}</p>}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Team Size</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {staffLoading ? '-' : filteredStaff.length}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{activeMembers} active now</p>
        </article>
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">On Leave</p>
          <p className="mt-3 text-3xl font-bold text-amber-700 dark:text-amber-300">
            {staffLoading ? '-' : onLeaveMembers}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{inactiveMembers} inactive</p>
        </article>
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Unresolved</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {overviewLoading ? '-' : queueTotals?.unresolved ?? 0}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {queueTotals?.unchecked ?? 0} unchecked
          </p>
        </article>
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Escalated</p>
          <p className="mt-3 text-3xl font-bold text-rose-700 dark:text-rose-300">
            {escalationsLoading ? '-' : escalatedCount}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Needs senior handling</p>
        </article>
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resolved</p>
          <p className="mt-3 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {overviewLoading ? '-' : queueTotals?.resolved ?? 0}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Closed or resolved</p>
        </article>
      </section>

      <section className="luxe-panel rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, title..."
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/70"
          />
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/70"
          >
            <option value="">All pods</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '' | StaffStatus)}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/70"
          >
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-end gap-2">
            <Link
              to="/cs/inbox"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Open Inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_2fr]">
        <article className="luxe-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pod Coverage</h2>
            <UsersRound className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {departmentsLoading ? (
              <p className="text-sm text-slate-500">Loading pods...</p>
            ) : podSummary.length === 0 ? (
              <p className="text-sm text-slate-500">No staff in current filters.</p>
            ) : (
              podSummary.map((pod) => (
                <div
                  key={pod.departmentId}
                  className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {pod.departmentName}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {pod.members} members
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      Active {pod.active}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      Leave {pod.onLeave}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="luxe-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {showMemberRoster ? 'Team Roster & Load' : 'Pod Load Summary'}
            </h2>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowMemberRoster((prev) => !prev)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {showMemberRoster ? 'Hide member roster' : 'Show member roster'}
            </button>
          </div>
          <div className="admin-table-wrapper overflow-auto">
            {showMemberRoster ? (
              <table className="admin-table min-w-[840px] text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">Member</th>
                    <th className="px-3 py-2 text-left">Pod</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Assigned</th>
                    <th className="px-3 py-2 text-left">Solved</th>
                    <th className="px-3 py-2 text-left">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {staffLoading && (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={6}>
                        Loading roster...
                      </td>
                    </tr>
                  )}
                  {!staffLoading && filteredStaff.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={6}>
                        No staff profiles match your filters.
                      </td>
                    </tr>
                  )}
                  {filteredStaff.map((profile) => {
                    const perf = performanceByEmail.get(profile.user.email.toLowerCase())
                    const isCurrentStaff =
                      Boolean(user?.staffProfileId) && profile.id === user?.staffProfileId
                    return (
                      <tr
                        key={profile.id}
                        className={isCurrentStaff ? 'bg-blue-50/60 dark:bg-blue-500/10' : undefined}
                      >
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {profile.user.name}
                            {isCurrentStaff ? (
                              <span className="ml-2 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-200">
                                You
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-slate-500">{profile.title}</p>
                        </td>
                        <td className="px-3 py-2">{profile.department.name}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${getStatusTone(profile.status)}`}>
                            {profile.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                          {perf?.assignedTotal ?? perf?.activeCount ?? 0}
                        </td>
                        <td className="px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-300">
                          {perf?.solvedCount ?? 0}
                        </td>
                        <td className="px-3 py-2">
                          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="h-3.5 w-3.5" />
                            {profile.user.email}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <table className="admin-table text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">Pod</th>
                    <th className="px-3 py-2 text-left">Members</th>
                    <th className="px-3 py-2 text-left">Active</th>
                    <th className="px-3 py-2 text-left">On Leave</th>
                    <th className="px-3 py-2 text-left">Assigned</th>
                    <th className="px-3 py-2 text-left">Solved</th>
                  </tr>
                </thead>
                <tbody>
                  {staffLoading && (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={6}>
                        Loading pod load...
                      </td>
                    </tr>
                  )}
                  {!staffLoading && podLoadSummary.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={6}>
                        No pod data for current filters.
                      </td>
                    </tr>
                  )}
                  {podLoadSummary.map((pod) => (
                    <tr key={pod.departmentId}>
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                        {pod.departmentName}
                      </td>
                      <td className="px-3 py-2">{pod.members}</td>
                      <td className="px-3 py-2">{pod.active}</td>
                      <td className="px-3 py-2">{pod.onLeave}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                        {pod.assignedTotal}
                      </td>
                      <td className="px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-300">
                        {pod.solvedCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">SLA Response Target</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">4 hours</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            First response for standard cases.
          </p>
        </article>
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Escalation Trigger</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5" />
            &gt; 24h stale
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Any open case with no owner or update.
          </p>
        </article>
        <article className="luxe-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">On-Call Contact</p>
          <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Phone className="h-4 w-4" />
            +1 (800) 555-0188
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Coverage 08:00 - 22:00 local
          </p>
        </article>
      </section>
    </div>
  )
}

export default CSTeamPage
