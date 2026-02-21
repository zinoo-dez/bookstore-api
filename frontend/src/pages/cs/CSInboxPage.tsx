import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { useInquiries } from '@/services/inquiries'
import { useAuthStore } from '@/store/auth.store'

const STATUS_OPTIONS = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const statusToneMap: Record<string, string> = {
  OPEN: 'border-[#d9cebf] bg-[#f6efe5] text-[#6f6559]',
  ASSIGNED: 'border-[#d5cbbf] bg-[#f4ede3] text-[#6d6254]',
  IN_PROGRESS: 'border-[#c7d1e0] bg-[#edf2f8] text-[#445a79]',
  ESCALATED: 'border-[#e7c9c4] bg-[#faeeec] text-[#8f4b45]',
  RESOLVED: 'border-[#cad7c6] bg-[#edf4ea] text-[#4f6849]',
  CLOSED: 'border-[#d8d2c8] bg-[#f3efe8] text-[#6d645a]',
}

const priorityToneMap: Record<string, string> = {
  LOW: 'text-[#6f6559]',
  MEDIUM: 'text-[#665d52]',
  HIGH: 'text-[#845d38]',
  URGENT: 'text-[#8f4b45]',
}

const labelize = (value?: string) => value?.split('_').join(' ') ?? ''
const isSolvedStatus = (status?: string) => {
  const normalized = status?.toUpperCase()
  return normalized === 'RESOLVED' || normalized === 'CLOSED'
}

const getWorkflowLabel = (item: {
  status?: string
  assignedToStaff?: {
    user?: {
      name?: string
    } | null
  } | null
}) => {
  const status = item.status?.toUpperCase() ?? 'OPEN'
  const assigneeName = item.assignedToStaff?.user?.name?.trim()

  if (status === 'RESOLVED' || status === 'CLOSED') {
    return {
      label: 'Solved',
      detail: assigneeName ? `by ${assigneeName}` : undefined,
      tone: 'border-[#cad7c6] bg-[#edf4ea] text-[#4f6849]',
    }
  }

  if (!assigneeName && status === 'OPEN') {
    return {
      label: 'Unchecked',
      detail: 'no owner yet',
      tone: 'border-[#ded4c6] bg-[#f5eee4] text-[#6b6154]',
    }
  }

  if (assigneeName) {
    return {
      label: 'In charge',
      detail: assigneeName,
      tone: 'border-[#c7d1e0] bg-[#edf2f8] text-[#445a79]',
    }
  }

  return {
    label: labelize(status),
    detail: undefined,
    tone: statusToneMap[status] ?? statusToneMap.OPEN,
  }
}

type CSInboxPageProps = {
  mode?: 'inbox' | 'inquiries'
}

const PAGE_SIZE = 25

const quickFilters = [
  { key: 'all', label: 'All' },
  { key: 'unchecked', label: 'Unchecked' },
  { key: 'inCharge', label: 'In charge' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'solved', label: 'Solved' },
] as const

type QuickFilter = (typeof quickFilters)[number]['key']

const getAgeChip = (updatedAt: string) => {
  const diffMs = Date.now() - new Date(updatedAt).getTime()
  const mins = Math.max(0, Math.floor(diffMs / 60000))

  if (mins < 60) {
    return {
      label: `${mins}m`,
      tone: mins > 20 ? 'text-[#8f4b45]' : 'text-[#6f6559]',
    }
  }

  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return {
      label: `${hours}h`,
      tone: hours > 6 ? 'text-[#8f4b45]' : 'text-[#6f6559]',
    }
  }

  const days = Math.floor(hours / 24)
  return {
    label: `${days}d`,
    tone: days > 2 ? 'text-[#8f4b45]' : 'text-[#6f6559]',
  }
}

const CSInboxPage = ({ mode = 'inbox' }: CSInboxPageProps) => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [onlyMine, setOnlyMine] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'oldestUnresolved' | 'priority'>('newest')
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 320)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, status, priority, mode])

  const { data, isLoading } = useInquiries({
    q: debouncedQuery || undefined,
    status: status || undefined,
    priority: priority || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const allItems = data?.items ?? []
  const items = useMemo(() => {
    if (mode === 'inquiries') return allItems
    return allItems.filter((item) => !isSolvedStatus(item.status))
  }, [allItems, mode])

  const displayedItems = useMemo(() => {
    let next = [...items]

    if (onlyMine) {
      next = next.filter((item) => item.assignedToStaff?.user?.id === user?.id)
    }

    if (quickFilter === 'unchecked') {
      next = next.filter((item) => !item.assignedToStaff?.user?.name && item.status?.toUpperCase() === 'OPEN')
    } else if (quickFilter === 'inCharge') {
      next = next.filter((item) => Boolean(item.assignedToStaff?.user?.name) && !isSolvedStatus(item.status))
    } else if (quickFilter === 'escalated') {
      next = next.filter((item) => item.status?.toUpperCase() === 'ESCALATED')
    } else if (quickFilter === 'solved') {
      next = next.filter((item) => isSolvedStatus(item.status))
    }

    next.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      if (sortBy === 'oldestUnresolved') {
        const aSolved = isSolvedStatus(a.status)
        const bSolved = isSolvedStatus(b.status)
        if (aSolved !== bSolved) return aSolved ? 1 : -1
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }

      const rank = (value?: string) => {
        const normalized = value?.toUpperCase()
        if (normalized === 'URGENT') return 4
        if (normalized === 'HIGH') return 3
        if (normalized === 'MEDIUM') return 2
        return 1
      }
      return rank(b.priority) - rank(a.priority)
    })

    return next
  }, [items, onlyMine, quickFilter, sortBy, user?.id])
  const totalLabel = useMemo(() => {
    if (mode === 'inquiries') return `${data?.total ?? 0} inquiries`
    return `${displayedItems.length} active inquiries`
  }, [data?.total, displayedItems.length, mode])
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? PAGE_SIZE)))
  const currentPage = data?.page ?? page
  const pageStart = data?.total ? (currentPage - 1) * (data?.limit ?? PAGE_SIZE) + 1 : 0
  const pageEnd = data?.total ? Math.min(currentPage * (data?.limit ?? PAGE_SIZE), data.total) : 0

  return (
    <div className="space-y-12">
      <section className="luxe-panel section-reveal rounded-2xl p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f7465] dark:text-slate-400">
              {mode === 'inquiries' ? 'Inquiries' : 'Inbox'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[#2a241d] dark:text-white">
              {mode === 'inquiries' ? 'Inquiry records' : 'Reader services overview'}
            </h1>
            <p className="mt-2 text-sm text-[#6d6253] dark:text-slate-400">
              {totalLabel}
            </p>
            <p className="mt-1 text-xs text-[#8a7f70] dark:text-slate-500">
              {mode === 'inquiries'
                ? 'Complete record, including solved cases.'
                : 'Action queue for unchecked and in-progress cases.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7465] dark:text-slate-400">
            <Filter className="h-4 w-4" />
            Filters
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_0.7fr_0.7fr]">
          <label className="flex items-center gap-2 rounded-xl border border-[#dfd3c3] bg-[#fffdf9] px-4 py-3 text-sm text-[#62584a] dark:border-slate-700 dark:bg-white/5 dark:text-slate-300">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subject"
              className="w-full bg-transparent text-sm text-[#2f2821] outline-none placeholder:text-[#a29381] dark:text-slate-100"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-[#dfd3c3] bg-[#fffdf9] px-4 py-3 text-sm text-[#5f5548] dark:border-slate-700 dark:bg-white/5 dark:text-slate-200"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>{labelize(item)}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="rounded-xl border border-[#dfd3c3] bg-[#fffdf9] px-4 py-3 text-sm text-[#5f5548] dark:border-slate-700 dark:bg-white/5 dark:text-slate-200"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>{labelize(item)}</option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {quickFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setQuickFilter(item.key)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                quickFilter === item.key
                  ? 'border-[#d4c5b1] bg-[#f3ecdf] text-[#2e2821]'
                  : 'border-[#dfd3c3] bg-[#fffdf9] text-[#6f6559] hover:border-[#d4c5b1]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOnlyMine((prev) => !prev)}
            className={`ml-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
              onlyMine
                ? 'border-[#c7d1e0] bg-[#edf2f8] text-[#445a79]'
                : 'border-[#dfd3c3] bg-[#fffdf9] text-[#6f6559] hover:border-[#d4c5b1]'
            }`}
          >
            Only mine
          </button>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest' | 'oldestUnresolved' | 'priority')}
            className="ml-auto rounded-xl border border-[#dfd3c3] bg-[#fffdf9] px-3 py-2 text-xs text-[#5f5548]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="oldestUnresolved">Oldest unresolved</option>
            <option value="priority">Priority first</option>
          </select>
        </div>
      </section>

      <section className="section-reveal rounded-2xl p-2">
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-[#ddd0bf] p-7 text-center text-sm text-[#7c7162] dark:border-slate-600 dark:text-slate-400">
            Loading inquiries...
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#ddd0bf] p-7 text-center text-sm text-[#7c7162] dark:border-slate-600 dark:text-slate-400">
            No inquiries match your filters.
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {displayedItems.map((item) => {
                const workflow = getWorkflowLabel(item)
                const age = getAgeChip(item.updatedAt)
                return (
                  <Link
                    key={item.id}
                    to={`/cs/inquiries/${item.id}`}
                    className="block rounded-2xl border border-transparent bg-white/50 p-6 shadow-[0_10px_34px_-30px_rgba(35,30,23,0.22)] backdrop-blur-sm transition hover:border-[#d4c5b1]/60 hover:bg-[#fffdf9]/70 dark:bg-white/[0.02] dark:hover:border-slate-600"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#2a241d] dark:text-white">
                          {item.subject || 'Inquiry'}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-[#7b7061] dark:text-slate-400">
                          {item.type?.toUpperCase()} • Priority {labelize(item.priority)}
                        </p>
                      </div>
                      <div className="text-right text-[11px] leading-relaxed text-[#867a6a] dark:text-slate-400">
                        <span className={priorityToneMap[item.priority?.toUpperCase() ?? 'LOW']}>
                          {labelize(item.priority)?.toUpperCase() || 'LOW'}
                        </span>
                        <p>{item.department?.name ?? 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${workflow.tone}`}
                      >
                        {workflow.label}
                      </span>
                      {workflow.detail && (
                        <span className="text-xs text-[#7b7061] dark:text-slate-400">
                          {workflow.detail}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs leading-relaxed text-[#7b7061] dark:text-slate-400">
                      <span>Messages: {item._count?.messages ?? 0}</span>
                      <span className={age.tone}>Age: {age.label}</span>
                      <span>Updated: {new Date(item.updatedAt).toLocaleString()}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7dccd] pt-4 text-sm text-[#74695b] dark:border-slate-700 dark:text-slate-400">
              <p>
                Showing {pageStart}-{pageEnd} of {data?.total ?? 0}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="metal-button rounded-xl px-3 py-1.5 text-sm text-[#5f5548] transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-white/5"
                >
                  Previous
                </button>
                <span className="text-xs uppercase tracking-[0.14em] text-[#8a7f70] dark:text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className="metal-button rounded-xl px-3 py-1.5 text-sm text-[#5f5548] transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-white/5"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default CSInboxPage
