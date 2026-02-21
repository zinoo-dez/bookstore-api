import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/services/auth'
import AdminSidebar from './AdminSidebar'

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
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
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

  return (
    <div
      className="admin-shell luxe-shell flex min-h-screen text-slate-900 dark:text-slate-100"
      data-admin-dept={departmentTheme}
    >
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <div className="luxe-glass-nav sticky top-3 z-20 mx-4 mt-3 flex items-center justify-end rounded-2xl px-6 py-3">
          <div className="relative">
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
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
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
