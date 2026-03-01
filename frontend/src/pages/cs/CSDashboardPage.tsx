import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  TrendingUp,
  UserCircle2,
  Zap,
} from 'lucide-react'
import { useInquiries, useInquiryOverview } from '@/services/inquiries'

const isSolvedStatus = (status?: string) => {
  const normalized = status?.toUpperCase()
  return normalized === 'RESOLVED' || normalized === 'CLOSED'
}

const labelize = (value?: string) => value?.split('_').join(' ') ?? ''

const timeAgo = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const CSDashboardPage = () => {
  const { data: overview, isLoading: isOverviewLoading } = useInquiryOverview(undefined, true)
  const { data, isLoading } = useInquiries({ page: 1, limit: 12 }, true)

  const totals = overview?.totals
  const latestActive = useMemo(
    () => (data?.items ?? []).filter((item) => !isSolvedStatus(item.status)).slice(0, 6),
    [data?.items],
  )

  const stats = [
    {
      key: 'unresolved',
      label: 'Unresolved',
      value: totals?.unresolved ?? 0,
      icon: Inbox,
      tone: 'border-amber-200/70 bg-amber-50/60 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
    },
    {
      key: 'unchecked',
      label: 'Unchecked',
      value: totals?.unchecked ?? 0,
      icon: Zap,
      tone: 'border-rose-200/70 bg-rose-50/60 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
    },
    {
      key: 'inCharge',
      label: 'In Charge',
      value: totals?.inCharge ?? 0,
      icon: TrendingUp,
      tone: 'border-sky-200/70 bg-sky-50/60 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100',
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: totals?.resolved ?? 0,
      icon: CheckCircle2,
      tone: 'border-emerald-200/70 bg-emerald-50/60 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    },
  ] as const

  return (
    <div className="space-y-6">
      <section className="cs-card relative overflow-hidden rounded-3xl p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-300/20 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-300/20 to-transparent blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Customer Service
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white lg:text-4xl">
              Service Overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 lg:text-base">
              Monitor current reader requests, response standards, and handoffs across the queue.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/cs/inbox"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              Open inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/cs/escalations"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
            >
              Escalations
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isOverviewLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="luxe-panel h-[142px] animate-pulse rounded-2xl border border-slate-200/60 bg-white/40 dark:border-slate-700/60 dark:bg-slate-900/30"
              />
            ))
          : stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.article
                  key={stat.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className={`luxe-panel rounded-2xl border p-5 ${stat.tone}`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 opacity-75" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
                      Live
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-4xl font-bold leading-none">{stat.value}</p>
                </motion.article>
              )
            })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <article className="cs-card rounded-3xl p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Latest Inquiries
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                Current Queue
              </h2>
            </div>
            <Link
              to="/cs/inquiries"
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading inquiry queue...
            </div>
          ) : latestActive.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-300" />
              <p className="mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                All caught up. No active inquiries right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestActive.map((item) => {
                const isUrgent = item.priority?.toUpperCase() === 'URGENT'
                const assigned = Boolean(item.assignedToStaff?.user?.name)
                return (
                  <Link
                    key={item.id}
                    to={`/cs/inquiries/${item.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white/70 p-4 transition hover:border-sky-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/45 dark:hover:border-sky-500/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {item.subject || 'New inquiry'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">{labelize(item.type).toUpperCase()}</span>
                          <span>•</span>
                          <span>{timeAgo(item.updatedAt)}</span>
                          <span>•</span>
                          <span>{item._count?.messages ?? 0} messages</span>
                          {item.department?.name ? (
                            <>
                              <span>•</span>
                              <span>{item.department.name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
                            <AlertTriangle className="h-3 w-3" />
                            Urgent
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <UserCircle2 className="h-3 w-3" />
                          {assigned ? 'Assigned' : 'New'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </article>

        <aside className="space-y-4">
          <article className="cs-card rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Response Target
            </p>
            <div className="mt-3 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              <Clock3 className="h-5 w-5 text-sky-600 dark:text-sky-300" />
              4 hours
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              First reply SLA for standard cases.
            </p>
          </article>

          <article className="cs-card rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Queue Health
            </p>
            <div className="mt-4 grid gap-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                <span className="text-slate-600 dark:text-slate-300">Unchecked</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{totals?.unchecked ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                <span className="text-slate-600 dark:text-slate-300">In charge</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{totals?.inCharge ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-sm dark:border-rose-500/30 dark:bg-rose-500/10">
                <span className="text-rose-700 dark:text-rose-300">Escalated</span>
                <span className="font-semibold text-rose-800 dark:text-rose-200">
                  {data?.items?.filter((item) => item.status?.toUpperCase() === 'ESCALATED').length ?? 0}
                </span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default CSDashboardPage
