import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  Cog,
  ExternalLink,
  Heart,
  MailCheck,
  Megaphone,
  MessageCircleMore,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type NotificationType,
  type UserNotification,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/services/notifications'
import { useBlogDetails } from '@/services/blogs'
import { useAddInquiryMessage, useInquiry } from '@/services/inquiries'

type FilterTab = 'all' | 'unread' | 'blog' | 'support'

const FILTERS: Array<{ label: string; value: FilterTab }> = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Blog', value: 'blog' },
  { label: 'Support', value: 'support' },
]

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string; chip: string }> = {
  support_reply: { icon: MessageCircleMore, color: 'text-sky-500', chip: 'Support' },
  announcement: { icon: Megaphone, color: 'text-violet-500', chip: 'Announcement' },
  inquiry_update: { icon: MailCheck, color: 'text-emerald-500', chip: 'Inquiry' },
  system: { icon: Cog, color: 'text-slate-500', chip: 'System' },
  blog_like: { icon: Heart, color: 'text-rose-500', chip: 'Blog' },
  blog_comment: { icon: MessageCircleMore, color: 'text-blue-500', chip: 'Blog' },
  blog_follow: { icon: UserPlus, color: 'text-indigo-500', chip: 'Blog' },
  inquiry_created: { icon: MailCheck, color: 'text-emerald-500', chip: 'Inquiry' },
  inquiry_assigned: { icon: MailCheck, color: 'text-emerald-500', chip: 'Inquiry' },
  inquiry_escalated: { icon: MailCheck, color: 'text-amber-500', chip: 'Inquiry' },
  inquiry_reply: { icon: MessageCircleMore, color: 'text-sky-500', chip: 'Inquiry' },
}

const BLOG_TYPES: NotificationType[] = ['blog_like', 'blog_comment', 'blog_follow']
const IOS_MODAL_SPRING = { type: 'spring', stiffness: 360, damping: 28, mass: 0.8 } as const
const REPLYABLE_TYPES: NotificationType[] = ['support_reply', 'inquiry_update', 'inquiry_reply']
const NO_REPLY_TYPES: NotificationType[] = ['announcement', 'system', 'blog_like', 'blog_comment', 'blog_follow', 'inquiry_created', 'inquiry_assigned', 'inquiry_escalated']

const relativeTime = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const getBlogIdFromLink = (link?: string | null) => {
  if (!link) return null
  const match = link.match(/\/blogs\/([a-z0-9-]+)/i)
  return match?.[1] ?? null
}

const getProfileIdFromLink = (link?: string | null) => {
  if (!link) return null
  const match = link.match(/\/user\/([a-z0-9-]+)/i)
  return match?.[1] ?? null
}

const getInquiryIdFromLink = (link?: string | null) => {
  if (!link) return null
  const match = link.match(/\/inquiries\/([a-z0-9-]+)/i)
  return match?.[1] ?? null
}

const NotificationRow = ({
  item,
  index,
  onOpen,
  onMarkRead,
  onDelete,
}: {
  item: UserNotification
  index: number
  onOpen: (item: UserNotification) => void
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) => {
  const meta = TYPE_META[item.type]
  const Icon = meta?.icon ?? Bell

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ ...IOS_MODAL_SPRING, delay: Math.min(index * 0.04, 0.28) }}
      className={cn(
        'rounded-2xl border bg-white p-4 transition dark:bg-slate-900',
        item.isRead
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-cyan-300/70 shadow-[0_0_0_1px_rgba(34,211,238,0.18)] dark:border-cyan-400/40',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <Icon className={cn('h-5 w-5', meta?.color ?? 'text-slate-500')} />
        </div>

        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(item)}>
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
            {!item.isRead && <span className="h-2 w-2 rounded-full bg-rose-500" />}
          </div>
          <p className="mt-1 text-base leading-snug text-slate-600 dark:text-slate-300">{item.message}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span>{relativeTime(item.createdAt)}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{meta?.chip ?? 'Notice'}</span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {!item.isRead && (
            <button
              type="button"
              onClick={() => onMarkRead(item.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:border-rose-300 hover:text-rose-600 dark:border-rose-900/60 dark:text-rose-300"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<UserNotification | null>(null)
  const [replyText, setReplyText] = useState('')
  const limit = 12

  const query = useMemo(() => {
    if (filter === 'unread') return { page, limit, unreadOnly: true }
    return { page, limit }
  }, [filter, page])

  const { data, isLoading } = useNotifications(query, { enabled: true, poll: true })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()
  const sendInquiryMessage = useAddInquiryMessage()

  const allItems = data?.items ?? []
  const filteredItems = useMemo(() => {
    if (filter === 'blog') {
      return allItems.filter((item) => BLOG_TYPES.includes(item.type))
    }
    if (filter === 'support') {
      return allItems.filter((item) => !BLOG_TYPES.includes(item.type))
    }
    return allItems
  }, [allItems, filter])

  const total = data?.total ?? 0
  const unreadCount = data?.unreadCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const selectedBlogId = getBlogIdFromLink(selected?.link)
  const selectedProfileId = getProfileIdFromLink(selected?.link)
  const selectedInquiryId = getInquiryIdFromLink(selected?.link)
  const { data: selectedBlog } = useBlogDetails(selectedBlogId ?? '', Boolean(selectedBlogId))
  const { data: selectedInquiry } = useInquiry(selectedInquiryId ?? '', Boolean(selectedInquiryId))
  const canReply = Boolean(selected && selectedInquiryId && REPLYABLE_TYPES.includes(selected.type))
  const noReply = Boolean(selected && NO_REPLY_TYPES.includes(selected.type))

  useEffect(() => {
    setReplyText('')
  }, [selected?.id])

  const handleOpen = async (item: UserNotification) => {
    if (!item.isRead) {
      await markRead.mutateAsync(item.id)
    }
    setSelected(item)
  }

  const handleOpenLinkedTarget = () => {
    if (!selected?.link) return
    navigate(selected.link)
    setSelected(null)
  }

  const primaryCtaLabel = useMemo(() => {
    if (!selected?.link) return 'Open'
    if (selected.type === 'blog_follow' && selectedProfileId) return 'View Profile'
    if (BLOG_TYPES.includes(selected.type) && selectedBlogId) return 'Open Blog'
    return 'Open'
  }, [selected, selectedProfileId, selectedBlogId])

  const handleFilter = (next: FilterTab) => {
    setFilter(next)
    setPage(1)
  }

  const handleSendReply = async () => {
    if (!canReply || !selectedInquiryId || !replyText.trim()) return
    await sendInquiryMessage.mutateAsync({
      inquiryId: selectedInquiryId,
      message: replyText.trim(),
    })
    setReplyText('')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Inbox</p>
          <h1 className="mt-1 text-4xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="mt-1 text-lg text-slate-600 dark:text-slate-400">Unread: {unreadCount}</p>
        </div>

        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold uppercase tracking-wide text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((tab) => (
          <div key={tab.value} className="relative">
            <button
              type="button"
              onClick={() => handleFilter(tab.value)}
              className={cn(
                'relative rounded-full border px-4 py-2 text-base font-semibold uppercase tracking-wide transition',
                filter === tab.value
                  ? 'border-cyan-300 text-cyan-800 dark:border-cyan-300/40 dark:text-cyan-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
              )}
            >
              {filter === tab.value && (
                <motion.span
                  layoutId="notifications-filter-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-cyan-50 dark:bg-cyan-500/10"
                  transition={IOS_MODAL_SPRING}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false} mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={IOS_MODAL_SPRING}
              className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-base text-slate-500 dark:border-slate-800 dark:bg-slate-900"
            >
              Loading notifications...
            </motion.div>
          ) : filteredItems.length === 0 ? (
            <motion.div
              key={`empty-${filter}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={IOS_MODAL_SPRING}
              className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-base text-slate-500 dark:border-slate-700 dark:bg-slate-900"
            >
              No notifications in this view.
            </motion.div>
          ) : (
            <motion.div
              key={`list-${filter}-${page}`}
              layout
              className="space-y-3"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {filteredItems.map((item, index) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    index={index}
                    onOpen={handleOpen}
                    onMarkRead={(id) => markRead.mutate(id)}
                    onDelete={(id) => deleteNotification.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <p className="text-base text-slate-500">Page {page} of {totalPages}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-6 text-base text-slate-500">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-amber-300">Back to home</Link>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.button
              type="button"
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-slate-900/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close notification detail"
            />
            <motion.aside
              className="fixed inset-x-0 bottom-0 z-50 h-[82vh] rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:inset-y-0 sm:right-0 sm:left-auto sm:h-screen sm:w-[min(560px,100vw)] sm:rounded-none sm:rounded-l-3xl sm:border-y-0 sm:border-r-0 sm:border-l sm:p-6"
              initial={{ opacity: 0, x: 20, y: 28 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 14, y: 24 }}
              transition={IOS_MODAL_SPRING}
            >
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Notification Detail</p>
                  <h3 className="truncate text-2xl font-semibold text-slate-900 dark:text-slate-100">{selected.title}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    {canReply && (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                        Reply enabled
                      </span>
                    )}
                    {noReply && (
                      <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        No-reply
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex h-[calc(100vh-12.5rem)] flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {selectedInquiry?.messages?.length ? (
                    selectedInquiry.messages.map((msg) => {
                      const isStaff = msg.senderType === 'STAFF'
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex', isStaff ? 'justify-start' : 'justify-end')}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] rounded-2xl px-4 py-3',
                              isStaff
                                ? 'rounded-tl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                : 'rounded-tr-md bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-100',
                            )}
                          >
                            <p className="text-base leading-relaxed">{msg.message}</p>
                            <p className={cn('mt-2 text-xs', isStaff ? 'text-slate-500' : 'text-cyan-800/80 dark:text-cyan-100/70')}>
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <p className="text-lg leading-relaxed">{selected.message}</p>
                        <p className="mt-2 text-sm text-slate-500">{relativeTime(selected.createdAt)}</p>
                      </div>
                    </div>
                  )}

                  {BLOG_TYPES.includes(selected.type) && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/30 dark:bg-cyan-950/20">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Blog Activity</p>
                      {selectedBlog ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedBlog.title}</p>
                          <p className="text-base text-slate-600 dark:text-slate-400">By {selectedBlog.author.name}</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
                          Open this notification to view the related post or author activity.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {canReply && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reply</p>
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      rows={3}
                      placeholder="Write your reply..."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={sendInquiryMessage.isPending || !replyText.trim()}
                        className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200"
                      >
                        Send reply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => deleteNotification.mutate(selected.id)}
                  className="text-base font-medium text-rose-600 hover:text-rose-700 dark:text-rose-300"
                >
                  Delete notification
                </button>
                <button
                  type="button"
                  onClick={handleOpenLinkedTarget}
                  disabled={!selected.link}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-base font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200"
                >
                  {primaryCtaLabel} <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationsPage
