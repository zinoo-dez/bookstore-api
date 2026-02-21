import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock3, UserCircle2 } from 'lucide-react'
import { useInquiries, useInquiryOverview } from '@/services/inquiries'

const isSolvedStatus = (status?: string) => {
  const normalized = status?.toUpperCase()
  return normalized === 'RESOLVED' || normalized === 'CLOSED'
}

const labelize = (value?: string) => value?.split('_').join(' ') ?? ''

const CSDashboardPage = () => {
  const { data: overview, isLoading: isOverviewLoading } = useInquiryOverview(undefined, true)
  const { data, isLoading } = useInquiries({ page: 1, limit: 12 }, true)

  const latestActive = useMemo(
    () => (data?.items ?? []).filter((item) => !isSolvedStatus(item.status)).slice(0, 6),
    [data?.items],
  )
  const totals = overview?.totals

  return (
    <div className="space-y-12">
      <section className="cs-card rounded-2xl p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f7465] dark:text-slate-400">
          Customer Service
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#2a241d] dark:text-white">
          Service overview
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5f5548] dark:text-slate-300">
          Monitor current reader requests, response standards, and case handoffs across the queue.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="cs-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f7465] dark:text-slate-400">Unresolved</p>
          <p className="mt-3 text-2xl font-semibold text-[#2a241d] dark:text-white">
            {isOverviewLoading ? '...' : (totals?.unresolved ?? 0)}
          </p>
        </article>
        <article className="cs-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f7465] dark:text-slate-400">Unchecked</p>
          <p className="mt-3 text-2xl font-semibold text-[#2a241d] dark:text-white">
            {isOverviewLoading ? '...' : (totals?.unchecked ?? 0)}
          </p>
        </article>
        <article className="cs-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f7465] dark:text-slate-400">In charge</p>
          <p className="mt-3 text-2xl font-semibold text-[#2a241d] dark:text-white">
            {isOverviewLoading ? '...' : (totals?.inCharge ?? 0)}
          </p>
        </article>
        <article className="cs-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f7465] dark:text-slate-400">Resolved</p>
          <p className="mt-3 text-2xl font-semibold text-[#2a241d] dark:text-white">
            {isOverviewLoading ? '...' : (totals?.resolved ?? 0)}
          </p>
        </article>
      </section>

      <section className="cs-card rounded-2xl p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f7465] dark:text-slate-400">
              Latest inquiries
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[#2a241d] dark:text-white">Current queue</h2>
          </div>
          <Link
            to="/cs/inbox"
            className="text-sm font-semibold text-[#615748] hover:text-[#2a241d] dark:text-slate-300 dark:hover:text-white"
          >
            Open inbox
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#ddd0bf] p-6 text-center text-sm text-[#7c7162] dark:border-slate-600 dark:text-slate-400">
            Loading inquiry queue...
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {latestActive.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#e8dccb] bg-[#fffdfa]/95 p-6 shadow-[0_16px_44px_-38px_rgba(35,30,23,0.35)] transition hover:border-[#d5c6b3] dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2a241d] dark:text-white">
                      {item.subject || 'New inquiry'}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#7f7465] dark:text-slate-400">
                      {labelize(item.type)?.toUpperCase()} • Updated {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#d6cabb] bg-[#f4ede3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#364967] dark:border-[#4a5f84]/40 dark:bg-[#1b2a41] dark:text-slate-200">
                      <UserCircle2 className="h-3.5 w-3.5" />
                      {item.assignedToStaff?.user?.name ? 'In charge' : 'Unchecked'}
                    </span>
                    {item.priority?.toUpperCase() === 'URGENT' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Urgent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#d6cabb] bg-[#f8f3eb] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f5548]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {labelize(item.status)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#5f5548] line-clamp-2 dark:text-slate-300">
                  {item.department?.name ?? 'No department assigned'} • Messages: {item._count?.messages ?? 0}
                </p>
              </div>
            ))}

            {!isLoading && latestActive.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#ddd0bf] p-6 text-center text-sm text-[#7c7162] dark:border-slate-600 dark:text-slate-400">
                No active inquiries right now.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default CSDashboardPage
