import { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, AlertTriangle, Zap, UserPlus, ArrowUpCircle, CheckCircle2, Eye } from 'lucide-react'
import { useInquiries } from '@/services/inquiries'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from '@/hooks/useToast'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { ToastContainer } from '@/components/cs/ToastNotification'
import QuickActionsMenu from '@/components/cs/QuickActionsMenu'
import ResponseTimer from '@/components/cs/ResponseTimer'
import InquiryPreviewPanel from '@/components/cs/InquiryPreviewPanel'
import BulkActionsBar from '@/components/cs/BulkActionsBar'
import KeyboardShortcutsHelp from '@/components/cs/KeyboardShortcutsHelp'
import { cn } from '@/lib/utils'

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

const CSInboxPage = ({ mode = 'inbox' }: CSInboxPageProps) => {
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [onlyMine, setOnlyMine] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'oldestUnresolved' | 'priority'>('newest')
  const [previewInquiryId, setPreviewInquiryId] = useState<string | null>(null)
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set())
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const user = useAuthStore((state) => state.user)
  const { toasts, removeToast, success, error, info } = useToast()
  const isKeyboardUser = useKeyboardNavigation()
  const currentStaffProfileId = user?.staffProfileId ?? null

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 320)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, status, priority, mode])

  const { data, isLoading, refetch } = useInquiries({
    q: debouncedQuery || undefined,
    status: status || undefined,
    priority: priority || undefined,
    page,
    limit: PAGE_SIZE,
  })

  // Auto-refresh every 60 seconds
  useAutoRefresh({
    enabled: true,
    interval: 60000,
    onRefresh: () => {
      void refetch()
      info('Inbox refreshed')
    },
  })

  // Keyboard shortcuts
  useKeyboardShortcuts({
    '/': () => searchInputRef.current?.focus(),
    'escape': () => {
      if (previewInquiryId) {
        setPreviewInquiryId(null)
      } else if (query) {
        setQuery('')
      } else if (selectedInquiries.size > 0) {
        setSelectedInquiries(new Set())
      } else if (showShortcuts) {
        setShowShortcuts(false)
      }
    },
    '?': () => setShowShortcuts(true),
    'r': () => {
      void refetch()
      success('Refreshed')
    },
    'arrowdown': () => {
      setSelectedIndex((prev) => Math.min(prev + 1, displayedItems.length - 1))
    },
    'arrowup': () => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    },
    'enter': () => {
      const item = displayedItems[selectedIndex]
      if (item) navigate(`/cs/inquiries/${item.id}`)
    },
    ' ': () => {
      // Space to preview selected inquiry
      const item = displayedItems[selectedIndex]
      if (item) setPreviewInquiryId(item.id)
    },
    'meta+a': () => {
      const allIds = new Set(displayedItems.map((item) => item.id))
      setSelectedInquiries(allIds)
      success(`Selected ${allIds.size} inquiries`)
    },
  })

  const allItems = data?.items ?? []
  const activeItems = useMemo(() => {
    if (mode === 'inquiries') return allItems
    return allItems.filter((item) => !isSolvedStatus(item.status))
  }, [allItems, mode])

  const displayedItems = useMemo(() => {
    let next = [...(mode === 'inquiries' || quickFilter === 'solved' ? allItems : activeItems)]

    if (onlyMine) {
      next = next.filter((item) => {
        if (currentStaffProfileId) {
          return item.assignedToStaff?.id === currentStaffProfileId
        }
        return item.assignedToStaff?.user?.id === user?.id
      })
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
  }, [activeItems, allItems, currentStaffProfileId, mode, onlyMine, quickFilter, sortBy, user?.id])
  const totalLabel = useMemo(() => {
    if (mode === 'inquiries') return `${data?.total ?? 0} inquiries`
    if (quickFilter === 'solved') return `${displayedItems.length} solved inquiries`
    return `${displayedItems.length} active inquiries`
  }, [data?.total, displayedItems.length, mode, quickFilter])
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? PAGE_SIZE)))
  const currentPage = data?.page ?? page
  const pageStart = data?.total ? (currentPage - 1) * (data?.limit ?? PAGE_SIZE) + 1 : 0
  const pageEnd = data?.total ? Math.min(currentPage * (data?.limit ?? PAGE_SIZE), data.total) : 0

  const toggleSelection = (id: string) => {
    setSelectedInquiries((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkAssign = () => {
    success(`Assigned ${selectedInquiries.size} inquiries`)
    setSelectedInquiries(new Set())
  }

  const handleBulkEscalate = () => {
    success(`Escalated ${selectedInquiries.size} inquiries`)
    setSelectedInquiries(new Set())
  }

  const handleBulkResolve = () => {
    success(`Resolved ${selectedInquiries.size} inquiries`)
    setSelectedInquiries(new Set())
  }

  const handleBulkDelete = () => {
    error(`Deleted ${selectedInquiries.size} inquiries`)
    setSelectedInquiries(new Set())
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <BulkActionsBar
        selectedCount={selectedInquiries.size}
        onClear={() => setSelectedInquiries(new Set())}
        onAssign={handleBulkAssign}
        onEscalate={handleBulkEscalate}
        onResolve={handleBulkResolve}
        onDelete={handleBulkDelete}
      />
      <InquiryPreviewPanel
        inquiryId={previewInquiryId}
        onClose={() => setPreviewInquiryId(null)}
        onOpenFull={(id) => {
          setPreviewInquiryId(null)
          navigate(`/cs/inquiries/${id}`)
        }}
      />
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="cs-card relative overflow-hidden rounded-3xl p-6 lg:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-sky-300/20 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-300/20 to-transparent blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
              {mode === 'inquiries' ? 'Inquiries' : 'Inbox'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white lg:text-4xl">
              {mode === 'inquiries' ? 'Inquiry records' : 'Reader services'}
            </h1>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              {totalLabel}
            </p>
          </div>
          <Link
            to={mode === 'inquiries' ? '/cs/inbox' : '/cs/inquiries'}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            {mode === 'inquiries' ? 'Open inbox' : 'Open inquiries'}
          </Link>
        </div>

        <div className="relative mt-8 grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subject"
              className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-600"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>{labelize(item)}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>{labelize(item)}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isKeyboardUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
              Keyboard mode
            </motion.div>
          )}
          {quickFilters.map((item) => (
            <motion.button
              key={item.key}
              type="button"
              onClick={() => setQuickFilter(item.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                quickFilter === item.key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </motion.button>
          ))}
          <motion.button
            type="button"
            onClick={() => setOnlyMine((prev) => !prev)}
            disabled={!currentStaffProfileId && !user?.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              onlyMine
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title={!currentStaffProfileId && !user?.id ? 'No logged-in staff identity found' : undefined}
          >
            Only mine
          </motion.button>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest' | 'oldestUnresolved' | 'priority')}
            className="ml-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="oldestUnresolved">Oldest unresolved</option>
            <option value="priority">Priority first</option>
          </select>
        </div>
        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
      </motion.section>

      <section className="cs-card space-y-3 rounded-3xl p-6">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400 dark:text-slate-600">
            Loading inquiries...
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400 dark:text-slate-600">
            No inquiries match your filters.
          </div>
        ) : (
          <>
            {displayedItems.map((item, index) => {
              const workflow = getWorkflowLabel(item)
              const isUrgent = item.priority?.toUpperCase() === 'URGENT'
              const isHigh = item.priority?.toUpperCase() === 'HIGH'
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    'group relative transition-all',
                    isKeyboardUser && selectedIndex === index && 'ring-2 ring-blue-500 ring-offset-2 rounded-lg dark:ring-offset-slate-950'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedInquiries.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Link
                      to={`/cs/inquiries/${item.id}`}
                      className="block flex-1"
                    >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                      className="relative py-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {item.subject || 'Inquiry'}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                            <span className="font-medium">{item.type?.toUpperCase()}</span>
                            <span>•</span>
                            <ResponseTimer updatedAt={item.updatedAt} slaMinutes={240} />
                            <span>•</span>
                            <span>{item._count?.messages ?? 0} messages</span>
                            {item.department?.name && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  {item.department.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                              <AlertTriangle className="h-3 w-3" />
                              Urgent
                            </span>
                          )}
                          {isHigh && !isUrgent && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              <Zap className="h-3 w-3" />
                              High
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${workflow.tone}`}>
                            {workflow.label}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setPreviewInquiryId(item.id)
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                              aria-label="Quick preview"
                              title="Quick preview (Space)"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <QuickActionsMenu
                              actions={[
                                {
                                  label: 'Assign to me',
                                  icon: UserPlus,
                                  onClick: () => {
                                    success(`Assigned inquiry to you`)
                                  },
                                },
                                {
                                  label: 'Escalate',
                                  icon: ArrowUpCircle,
                                  onClick: () => {
                                    navigate(`/cs/inquiries/${item.id}`)
                                  },
                                  variant: 'warning',
                                },
                                {
                                  label: 'Mark resolved',
                                  icon: CheckCircle2,
                                  onClick: () => {
                                    success(`Marked as resolved`)
                                  },
                                  variant: 'success',
                                },
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                    </motion.div>
                  </Link>
                  </div>
                </div>
              )
            })}

            <div className="mt-8 flex items-center justify-between pt-6">
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Showing {pageStart}-{pageEnd} of {data?.total ?? 0}
              </p>
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Previous
                </motion.button>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <motion.button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Next
                </motion.button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default CSInboxPage
