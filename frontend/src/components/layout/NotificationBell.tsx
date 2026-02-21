import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Cog, Heart, MailCheck, Megaphone, MessageCircleMore, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type UserNotification,
  type NotificationType,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/services/notifications'

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string; chip: string }> = {
  support_reply: { icon: MessageCircleMore, color: 'text-sky-400', chip: 'Support' },
  announcement: { icon: Megaphone, color: 'text-violet-400', chip: 'Announcement' },
  inquiry_update: { icon: MailCheck, color: 'text-emerald-400', chip: 'Inquiry' },
  system: { icon: Cog, color: 'text-slate-400', chip: 'System' },
  blog_like: { icon: Heart, color: 'text-rose-400', chip: 'Blog' },
  blog_comment: { icon: MessageCircleMore, color: 'text-blue-400', chip: 'Blog' },
  blog_follow: { icon: UserPlus, color: 'text-indigo-400', chip: 'Blog' },
  inquiry_created: { icon: MailCheck, color: 'text-emerald-400', chip: 'Inquiry' },
  inquiry_assigned: { icon: MailCheck, color: 'text-emerald-400', chip: 'Inquiry' },
  inquiry_escalated: { icon: MailCheck, color: 'text-amber-400', chip: 'Inquiry' },
  inquiry_reply: { icon: MessageCircleMore, color: 'text-sky-400', chip: 'Inquiry' },
}

const BLOG_TYPES: NotificationType[] = ['blog_like', 'blog_comment', 'blog_follow']
const IOS_SPRING = { type: 'spring', stiffness: 420, damping: 30, mass: 0.75 } as const

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

const NotificationItem = ({
  item,
  onOpen,
}: {
  item: UserNotification
  onOpen: (item: UserNotification) => void
}) => {
  const meta = TYPE_META[item.type]
  const Icon = meta?.icon ?? Bell

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(item)}
      whileTap={{ scale: 0.985 }}
      transition={IOS_SPRING}
      className={cn(
        'w-full rounded-2xl border px-3.5 py-3 text-left transition',
        item.isRead
          ? 'border-white/50 bg-white/50 hover:border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-800/80'
          : 'border-cyan-200/70 bg-cyan-50/70 shadow-[0_0_18px_rgba(56,189,248,0.14)] dark:border-cyan-500/30 dark:bg-cyan-950/20',
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', meta?.color ?? 'text-slate-400')} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
            {!item.isRead && <span className="h-2 w-2 rounded-full bg-rose-500" />}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{item.message}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <span>{relativeTime(item.createdAt)}</span>
            <span className="rounded-full bg-slate-900/5 px-1.5 py-0.5 dark:bg-white/10">{meta?.chip ?? 'Notice'}</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

const NotificationBell = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const { data: unreadData } = useUnreadNotificationsCount(true)
  const unreadCount = unreadData?.unreadCount ?? 0

  const { data: notificationsData } = useNotifications(
    { page: 1, limit: 8, unreadOnly: true },
    { enabled: true, poll: true },
  )
  const notifications = (notificationsData?.items ?? []).filter((item) => !item.isRead)

  const markOneRead = useMarkNotificationRead()

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const grouped = useMemo(() => {
    return {
      blog: notifications.filter((item) => BLOG_TYPES.includes(item.type)),
      system: notifications.filter((item) => !BLOG_TYPES.includes(item.type)),
    }
  }, [notifications])

  const hasNotifications = notifications.length > 0

  const handleOpenItem = async (item: UserNotification) => {
    if (!item.isRead) {
      try {
        await markOneRead.mutateAsync(item.id)
      } catch {
        // Best effort
      }
    }

    setOpen(false)
    navigate(item.link || '/notifications')
  }

  return (
    <div ref={rootRef} className="relative">
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} transition={IOS_SPRING}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="relative inline-flex items-center justify-center p-2 text-slate-700 transition-colors hover:text-primary-600 dark:text-slate-300 dark:hover:text-amber-200"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 z-50 mt-2 w-[420px] rounded-3xl border border-white/60 bg-white/85 p-3 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/90"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={IOS_SPRING}
          >
          <div className="flex items-center justify-between px-2 py-2">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/notifications')
              }}
              className="text-sm font-semibold uppercase tracking-wide text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              View all
            </button>
          </div>

          {hasNotifications ? (
            <div className="max-h-[30rem] space-y-4 overflow-y-auto pb-1">
              {grouped.blog.length > 0 && (
                <section>
                <div className="mb-1 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Blog Activity</p>
                  <span className="text-xs text-slate-500">{grouped.blog.length}</span>
                </div>
                <div className="space-y-1">
                  {grouped.blog.map((item) => (
                    <NotificationItem key={item.id} item={item} onOpen={handleOpenItem} />
                  ))}
                </div>
              </section>
              )}

              {grouped.system.length > 0 && (
                <section>
                <div className="mb-1 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">System & Support</p>
                  <span className="text-xs text-slate-500">{grouped.system.length}</span>
                </div>
                <div className="space-y-1">
                  {grouped.system.map((item) => (
                    <NotificationItem key={item.id} item={item} onOpen={handleOpenItem} />
                  ))}
                </div>
              </section>
              )}
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-base text-slate-500 dark:text-slate-400">
              No notifications yet.
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell
