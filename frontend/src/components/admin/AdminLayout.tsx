import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronDown, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/services/auth'
import AdminSidebar from './AdminSidebar'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'
import { useTheme } from '@/hooks/useTheme'

const resolveDepartmentTheme = (
  role?: string,
  departmentCode?: string | null,
  departmentName?: string | null,
) => {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return 'admin'
  }

  const code = (departmentCode || '').toUpperCase()
  const name = (departmentName || '').toLowerCase()

  if (code.includes('HR') || name.includes('human') || name.includes('hr')) {
    return 'hr'
  }
  if (
    code.includes('CS')
    || code.includes('SUPPORT')
    || name.includes('support')
    || name.includes('customer')
  ) {
    return 'cs'
  }
  if (code.includes('FIN') || name.includes('finance') || name.includes('account')) {
    return 'finance'
  }
  if (
    code.includes('STOCK')
    || code.includes('WH')
    || name.includes('warehouse')
    || name.includes('stock')
  ) {
    return 'warehouse'
  }
  if (code.includes('LEGAL') || name.includes('legal') || name.includes('compliance')) {
    return 'legal'
  }

  return 'admin'
}

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const { theme, toggleTheme } = useTheme()
  const roleLabel =
    user?.primaryStaffRoleName ||
    user?.primaryStaffRoleCode ||
    user?.role ||
    null
  const departmentTheme = resolveDepartmentTheme(
    user?.role,
    user?.staffDepartmentCode,
    user?.staffDepartmentName,
  )

  useEffect(() => {
    if (!menuOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  return (
    <div
      className="admin-shell luxe-shell flex min-h-screen text-slate-900 dark:text-slate-100"
      data-admin-dept={departmentTheme}
    >
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10">
            <AdminSidebar mobile onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <ScrollProgressBar topClassName="top-0" widthClassName="w-full" />
        <div className="luxe-glass-nav sticky top-3 z-20 mx-4 mt-3 flex items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
          <button
            type="button"
            className="metal-button inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150 hover:border-[var(--admin-accent-border)] lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          <div className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              className="metal-button relative inline-flex h-9 w-14 items-center rounded-full transition-colors"
            >
              <span className="sr-only">Toggle theme</span>
              <span
                className={`
                  inline-flex h-7 w-7 items-center justify-center
                  transform rounded-full
                  bg-slate-100 text-slate-600 shadow-sm
                  transition-all
                  dark:bg-[#E6B65C] dark:text-slate-900 dark:shadow-[0_0_8px_rgba(230,182,92,0.35)]
                  ${theme === 'dark' ? 'translate-x-6 bg-[#E6B65C] text-slate-900' : 'translate-x-1'}
                `}
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 116.707 2.707a6 6 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="metal-button inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150 hover:border-[var(--admin-accent-border)]"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--admin-accent)] text-xs font-semibold text-white dark:text-slate-950">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span className="max-w-[180px] truncate">{user?.name || 'Account'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="luxe-panel absolute right-0 z-40 mt-3 w-64 bg-white/95 p-3 dark:bg-slate-900/95">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                {roleLabel && (
                  <span className="mt-2 inline-flex rounded-full border border-[var(--admin-accent-border)] bg-[var(--admin-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
                    {roleLabel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition-all duration-150 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
