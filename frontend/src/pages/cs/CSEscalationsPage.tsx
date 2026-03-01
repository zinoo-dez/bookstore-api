import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Clock3, ShieldAlert } from 'lucide-react'
import { useInquiries } from '@/services/inquiries'

const CSEscalationsPage = () => {
  const { data, isLoading } = useInquiries({ status: 'ESCALATED', page: 1, limit: 20 })
  const items = data?.items ?? []

  return (
    <div className="space-y-6">
      <section className="cs-card relative overflow-hidden rounded-3xl p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-rose-300/25 to-transparent blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Escalations
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white lg:text-4xl">
              Escalated Cases
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 lg:text-base">
              Cases currently flagged for senior review and priority response.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              {items.length} active
            </span>
            <Link
              to="/cs/inbox"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              Open inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="cs-card rounded-3xl p-6">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Loading escalations...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-10 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <Clock3 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-300" />
            <p className="mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              No escalations right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/cs/inquiries/${item.id}`}
                className="block rounded-2xl border border-slate-200 bg-white/80 p-5 transition hover:border-rose-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/45 dark:hover:border-rose-500/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {item.subject || 'Inquiry'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.type?.toUpperCase()} • Priority {item.priority?.toUpperCase()}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
                    <AlertTriangle className="h-3 w-3" />
                    Escalated
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>Department: {item.department?.name ?? 'Unassigned'}</span>
                  <span>Messages: {item._count?.messages ?? 0}</span>
                  <span>Updated: {new Date(item.updatedAt).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default CSEscalationsPage
