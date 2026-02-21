import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useInquiries } from '@/services/inquiries'

const CSEscalationsPage = () => {
  const { data, isLoading } = useInquiries({ status: 'ESCALATED', page: 1, limit: 20 })
  const items = data?.items ?? []

  return (
    <div className="space-y-12">
      <section className="cs-card rounded-2xl p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f7465] dark:text-slate-400">
              Escalations
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[#2a241d] dark:text-white">
              Escalated cases
            </h1>
            <p className="mt-2 text-sm text-[#6d6253] dark:text-slate-400">
              Cases currently flagged for senior review and priority response.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e7c9c4] bg-[#f8ecea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9b554e] dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4" />
            Escalated
          </div>
        </div>
      </section>

      <section className="cs-card rounded-2xl p-7">
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-[#decfc2] p-7 text-center text-sm text-[#7a6f61] dark:border-slate-600 dark:text-slate-400">
            Loading escalations...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#decfc2] p-7 text-center text-sm text-[#7a6f61] dark:border-slate-600 dark:text-slate-400">
            No escalations right now.
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/cs/inquiries/${item.id}`}
                className="block rounded-xl border border-[#ecd3cf] bg-[#fff8f6]/95 p-6 shadow-[0_16px_44px_-38px_rgba(49,28,24,0.34)] transition hover:border-[#deb8b2] dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#2a241d] dark:text-white">
                      {item.subject || 'Inquiry'}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#7a6f61] dark:text-slate-400">
                      {item.type?.toUpperCase()} • Priority {item.priority?.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-xs text-[#7a6f61] dark:text-slate-400">
                    {item.department?.name ?? 'Unassigned'}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-[#e7c9c4] bg-[#faeeec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b554e] dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200">
                    Escalated
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs leading-relaxed text-[#7a6f61] dark:text-slate-400">
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
