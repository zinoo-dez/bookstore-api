import { Link, useLocation } from 'react-router-dom'
import { Headset, Inbox, LifeBuoy, MessageSquareText, ShieldAlert, UsersRound } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useInquiries, useInquiryOverview } from '@/services/inquiries'
import { cn } from '@/lib/utils'
import LiveBadge from './LiveBadge'

const navItems = [
  { name: 'Dashboard', path: '/cs', icon: Headset },
  { name: 'Inbox', path: '/cs/inbox', icon: Inbox },
  { name: 'Inquiries', path: '/cs/inquiries', icon: MessageSquareText },
  { name: 'Escalations', path: '/cs/escalations', icon: ShieldAlert },
  { name: 'Team', path: '/cs/team', icon: UsersRound },
  { name: 'Knowledge', path: '/cs/knowledge', icon: LifeBuoy },
]

const CSSidebar = () => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { data: overview } = useInquiryOverview(undefined, true)
  const { data: escalations } = useInquiries({ status: 'ESCALATED', page: 1, limit: 1 }, true)
  const escalatedCount = escalations?.total ?? 0

  return (
    <>
      <div className="luxe-panel mb-4 overflow-x-auto rounded-2xl p-2 lg:hidden">
        <nav className="flex min-w-max items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/cs' && location.pathname.startsWith(item.path))
            const Icon = item.icon
            return (
              <Link
                key={`mobile-${item.name}-${item.path}`}
                to={item.path}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'border-[#bfd5ee] bg-[#eaf4ff] text-[#214567] dark:border-[#3a6488] dark:bg-[#112339] dark:text-slate-100'
                    : 'border-transparent text-[#5e6877] hover:border-[#cad9ea] hover:bg-white/70 dark:text-slate-300 dark:hover:border-slate-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <aside className="luxe-panel sticky top-6 hidden h-[calc(100vh-3rem)] w-64 flex-shrink-0 rounded-2xl p-6 lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#61738a] dark:text-slate-400">
            Customer Service
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#14263a] dark:text-white">Service Desk</h2>
          <p className="mt-1 text-sm text-[#71839a] dark:text-slate-400">
            {user?.staffTitle || 'Service workflow'}
          </p>
          <p className="mt-2 text-xs text-[#5f7087] dark:text-slate-400">
            Signed in as {user?.name || 'Unknown staff'}
            {user?.staffEmployeeCode ? ` • ${user.staffEmployeeCode}` : ''}
          </p>
        </div>

        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/cs' && location.pathname.startsWith(item.path))
            const Icon = item.icon
            return (
              <Link
                key={`${item.name}-${item.path}`}
                to={item.path}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl border px-3 py-2.5 pl-4 text-sm font-semibold transition',
                  isActive
                    ? 'luxe-card border-[#bdd4ee] bg-[#e9f3ff] text-[#1e4061] dark:border-[#3a6488] dark:bg-[#112339] dark:text-slate-100'
                    : 'border-transparent text-[#62748b] hover:border-[#c7d7ea] hover:text-[#1f2f44] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white'
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-1 w-0.5 rounded-full bg-[#2d5d8c] dark:bg-[#8eb5d8]" />
                )}
                <Icon className="h-4 w-4 opacity-80" />
                <span className="flex-1">{item.name}</span>
                {item.path === '/cs/inbox' && overview?.totals?.unchecked && (
                  <LiveBadge count={overview.totals.unchecked} variant="urgent" size="sm" />
                )}
                {item.path === '/cs/escalations' && escalatedCount > 0 && (
                  <LiveBadge count={escalatedCount} variant="urgent" size="sm" />
                )}
              </Link>
            )
          })}
        </nav>

        <p className="mt-6 border-t border-[#c7d7ea] pt-4 text-xs text-[#71839a] dark:border-slate-700 dark:text-slate-400">
          Queue refreshes every minute.
        </p>
      </aside>
    </>
  )
}

export default CSSidebar
