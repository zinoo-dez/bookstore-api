import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/lib/permissions'
import {
  LayoutDashboard,
  BookOpen,
  DollarSign,
  Package,
  Users,
  Warehouse,
  Building2,
  ShieldCheck,
  ListTodo,
  BarChart3,
  ClipboardCheck,
  Truck,
  MessageCircleMore,
  Trash2,
  X,
  LucideIcon,
} from 'lucide-react'

interface NavItem {
  name: string
  path: string
  icon: LucideIcon
  section: 'overview' | 'catalog' | 'commerce' | 'operations' | 'people'
  permission?: string | string[]
  requireAll?: boolean
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, section: 'overview' },
  { name: 'Books', path: '/admin/books', icon: BookOpen, section: 'catalog', adminOnly: true },
  { name: 'Bin', path: '/admin/bin', icon: Trash2, section: 'catalog', adminOnly: true },
  { name: 'Inquiries', path: '/admin/inquiries', icon: MessageCircleMore, section: 'commerce', adminOnly: true },
  { name: 'Orders', path: '/admin/orders', icon: Package, section: 'commerce', permission: 'finance.reports.view' },
  { name: 'Promotions', path: '/admin/promotions', icon: DollarSign, section: 'commerce', permission: 'finance.payout.manage' },
  { name: 'Delivery', path: '/admin/delivery', icon: Truck, section: 'operations', permission: 'warehouse.purchase_order.view' },
  { name: 'Warehouses', path: '/admin/warehouses', icon: Warehouse, section: 'operations', permission: 'warehouse.view' },
  { name: 'Book Distribution', path: '/admin/book-distribution', icon: BookOpen, section: 'operations', permission: 'warehouse.view' },
  { name: 'Stores', path: '/admin/stores', icon: Building2, section: 'operations', permission: 'warehouse.view' },
  { name: 'Vendors', path: '/admin/vendors', icon: Building2, section: 'operations', permission: ['warehouse.view', 'warehouse.vendor.manage'], requireAll: false },
  { name: 'Purchase Requests', path: '/admin/purchase-requests', icon: ClipboardCheck, section: 'operations', permission: ['warehouse.purchase_request.view', 'finance.purchase_request.review', 'finance.purchase_request.approve', 'finance.purchase_request.reject'], requireAll: false },
  { name: 'Purchase Orders', path: '/admin/purchase-orders', icon: Truck, section: 'operations', permission: ['warehouse.purchase_order.view', 'finance.purchase_order.view', 'warehouse.purchase_order.create', 'warehouse.purchase_order.receive'], requireAll: false },
  { name: 'Users', path: '/admin/users', icon: Users, section: 'people', adminOnly: true },
  { name: 'Staff', path: '/admin/staff', icon: Users, section: 'people', permission: 'staff.view' },
  { name: 'Departments', path: '/admin/staff/departments', icon: Building2, section: 'people', permission: ['staff.manage', 'staff.view'], requireAll: true },
  { name: 'Role Matrix', path: '/admin/staff/roles', icon: ShieldCheck, section: 'people', permission: 'admin.permission.manage' },
  { name: 'Staff Tasks', path: '/admin/staff/tasks', icon: ListTodo, section: 'people', permission: ['staff.view', 'hr.performance.manage'], requireAll: true },
  { name: 'Performance', path: '/admin/staff/performance', icon: BarChart3, section: 'people', permission: 'hr.performance.manage' },
]

const sectionLabels: Record<NavItem['section'], string> = {
  overview: 'Overview',
  catalog: 'Catalog',
  commerce: 'Commerce',
  operations: 'Operations',
  people: 'People',
}

interface AdminSidebarProps {
  mobile?: boolean
  onCloseMobile?: () => void
}

const AdminSidebar = ({ mobile = false, onCloseMobile }: AdminSidebarProps) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuthStore()
  const isHrFocusedUser =
    user?.role === 'USER'
    && (
      hasPermission(user?.permissions, 'staff.view')
      || hasPermission(user?.permissions, 'staff.manage')
      || hasPermission(user?.permissions, 'hr.performance.manage')
    )
    && !hasPermission(user?.permissions, 'finance.reports.view')
    && !hasPermission(user?.permissions, 'warehouse.view')
  const isWarehouseFocusedUser =
    user?.role === 'USER'
    && hasPermission(user?.permissions, 'warehouse.view')
    && (hasPermission(user?.permissions, 'warehouse.stock.update') || hasPermission(user?.permissions, 'warehouse.transfer'))
    && !hasPermission(user?.permissions, 'finance.reports.view')
    && !hasPermission(user?.permissions, 'staff.view')
  const hrFocusedPaths = new Set([
    '/admin',
    '/admin/staff',
    '/admin/staff/departments',
    '/admin/staff/roles',
    '/admin/staff/tasks',
    '/admin/staff/performance',
  ])
  const warehouseFocusedPaths = new Set([
    '/admin',
    '/admin/delivery',
    '/admin/warehouses',
    '/admin/book-distribution',
    '/admin/stores',
    '/admin/purchase-requests',
    '/admin/purchase-orders',
  ])
  const visibleNavItems = navItems.filter((item) => {
    if (isHrFocusedUser && !hrFocusedPaths.has(item.path)) {
      return false
    }
    if (isWarehouseFocusedUser && !warehouseFocusedPaths.has(item.path)) {
      return false
    }

    if (item.adminOnly) {
      return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    }

    if (!item.permission) {
      return true
    }

    const permissions = Array.isArray(item.permission) ? item.permission : [item.permission]
    if (item.requireAll) {
      return permissions.every((key) => hasPermission(user?.permissions, key))
    }

    return permissions.some((key) => hasPermission(user?.permissions, key))
  })

  const departmentName = user?.staffDepartmentName?.trim()
  const sidebarTitle =
    user?.role === 'USER' && departmentName ? departmentName : 'Admin Panel'
  const sidebarSubtitle =
    user?.role === 'USER' && departmentName
      ? `${departmentName} workspace`
      : isHrFocusedUser
        ? 'HR operations workspace'
        : isWarehouseFocusedUser
          ? 'Warehouse operations workspace'
          : 'Manage your store'
  const visibleSectionOrder = ['overview', 'catalog', 'commerce', 'operations', 'people'] as const

  return (
    <div
      className={`luxe-panel ${mobile ? 'w-[18.5rem] h-full rounded-none border-0' : `${isCollapsed ? 'w-16' : 'w-[13.25rem]'} h-[calc(100vh-1.5rem)] sticky top-3 ml-3 rounded-2xl`} flex flex-col transition-all duration-200`}
    >
      {/* Logo/Title & Toggle */}
      <div className="p-4 border-b border-slate-200/70 flex items-center justify-between dark:border-slate-800/80">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-bold leading-tight text-gray-900 dark:text-slate-100">{sidebarTitle}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{sidebarSubtitle}</p>
          </div>
        )}
        <button
          onClick={() => {
            if (mobile) {
              onCloseMobile?.()
              return
            }
            setIsCollapsed(!isCollapsed)
          }}
          className="metal-button p-2 rounded-lg transition-colors"
          title={mobile ? 'Close menu' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {mobile ? (
            <X className="h-4 w-4" />
          ) : (
            <span className="text-base">{isCollapsed ? '→' : '←'}</span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1 overflow-y-auto space-y-3">
        {visibleSectionOrder.map((sectionKey) => {
          const sectionItems = visibleNavItems.filter((item) => item.section === sectionKey)
          if (!sectionItems.length) return null

          return (
            <div key={sectionKey}>
              {!isCollapsed && (
                <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {sectionLabels[sectionKey]}
                </p>
              )}
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  const displayName = isWarehouseFocusedUser && item.path === '/admin'
                    ? 'Warehouse Overview'
                    : item.name
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="relative block"
                      title={isCollapsed ? displayName : ''}
                      onClick={() => {
                        if (mobile) onCloseMobile?.()
                      }}
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`relative flex items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-1.5 transition-all duration-150
                  before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:transition-colors
                  ${isActive
                    ? "luxe-card bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] before:bg-[var(--admin-accent)]"
                    : "text-gray-700 hover:bg-slate-100/80 hover:text-[var(--admin-accent)] before:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[var(--admin-accent)]"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
                      >
                        {/* ICON */}
                        <Icon
                          className={`h-5 w-5 flex-shrink-0
                    ${isActive ? "text-[var(--admin-accent)]" : "text-gray-500 dark:text-slate-400"}
                  `}
                        />

                        {/* LABEL */}
                        {!isCollapsed && (
                          <span className="text-[13px] font-medium">
                            {displayName}
                          </span>
                        )}
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className={`p-3 border-t border-slate-200/70 bg-white/30 ${isCollapsed ? 'text-center' : ''} dark:border-slate-800/80 dark:bg-slate-950/30`}>
        <div className="text-xs text-gray-500 dark:text-slate-500">
          <p>{isCollapsed ? 'v1.0' : 'Admin v1.0'}</p>
          {!isCollapsed && user && (
            <p className="mt-1 truncate text-[11px]">{user.name}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar
