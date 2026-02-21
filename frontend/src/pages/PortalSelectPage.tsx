import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { canAccessCS, hasPermission } from '@/lib/permissions'

const PortalSelectPage = () => {
  const navigate = useNavigate()
  const setPortalMode = useAuthStore((state) => state.setPortalMode)
  const user = useAuthStore((state) => state.user)

  const choosePortal = (mode: 'buyer' | 'staff') => {
    setPortalMode(mode)
    if (mode === 'staff') {
      const canUseCS = canAccessCS(user?.role, user?.permissions)
        || hasPermission(user?.permissions, 'support.inquiries.view')
        || hasPermission(user?.permissions, 'marketing.inquiries.view')
        || hasPermission(user?.permissions, 'marketing.inquiries.reply')
        || hasPermission(user?.permissions, 'marketing.inquiries.manage')
        || hasPermission(user?.permissions, 'support.messages.view')
      const staffPortalPath =
        user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
          ? '/admin'
          : canUseCS
            ? '/cs'
            : '/admin'
      navigate(staffPortalPath, { replace: true })
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Choose Portal</p>
        <h1 className="mt-2 text-2xl font-bold">Where do you want to go first?</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You have both buyer and staff access. Pick your workspace for this session.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choosePortal('buyer')}
            className="rounded-xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Buyer Side
            <p className="mt-1 text-xs font-normal text-slate-500">Browse books, library, blogs, and orders.</p>
          </button>
          <button
            type="button"
            onClick={() => choosePortal('staff')}
            className="rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white hover:opacity-95 dark:bg-amber-400 dark:text-slate-900"
          >
            Staff Side
            <p className="mt-1 text-xs font-normal text-slate-200 dark:text-slate-700">Open admin tools and department tasks.</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PortalSelectPage
