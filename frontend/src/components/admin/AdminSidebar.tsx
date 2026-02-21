import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/lib/permissions'
import { LayoutDashboard,
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
  LucideIcon
} from "lucide-react";

interface NavItem {
  name: string
  path: string
  icon: LucideIcon
  permission?: string | string[]
  requireAll?: boolean
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Books', path: '/admin/books', icon: BookOpen, adminOnly: true },
  { name: 'Orders', path: '/admin/orders', icon: Package, permission: 'finance.reports.view' },
  { name: 'Promotions', path: '/admin/promotions', icon: DollarSign, permission: 'finance.payout.manage' },
  { name: 'Delivery', path: '/admin/delivery', icon: Truck, permission: 'warehouse.purchase_order.view' },
  { name: 'Warehouses', path: '/admin/warehouses', icon: Warehouse, permission: 'warehouse.view' },
  { name: 'Book Distribution', path: '/admin/book-distribution', icon: BookOpen, permission: 'warehouse.view' },
  { name: 'Vendors', path: '/admin/vendors', icon: Building2, permission: ['warehouse.view', 'warehouse.vendor.manage'], requireAll: false },
  { name: 'Purchase Requests', path: '/admin/purchase-requests', icon: ClipboardCheck, permission: ['warehouse.purchase_request.view', 'finance.purchase_request.review', 'finance.purchase_request.approve', 'finance.purchase_request.reject'], requireAll: false },
  { name: 'Purchase Orders', path: '/admin/purchase-orders', icon: Truck, permission: ['warehouse.purchase_order.view', 'finance.purchase_order.view', 'warehouse.purchase_order.create', 'warehouse.purchase_order.receive'], requireAll: false },
  { name: 'Inquiries', path: '/admin/inquiries', icon: MessageCircleMore, adminOnly: true },
  { name: 'Users', path: '/admin/users', icon: Users, adminOnly: true },
  { name: 'Staff', path: '/admin/staff', icon: Users, permission: 'staff.view' },
  { name: 'Departments', path: '/admin/staff/departments', icon: Building2, permission: ['staff.manage', 'staff.view'], requireAll: true },
  { name: 'Role Matrix', path: '/admin/staff/roles', icon: ShieldCheck, permission: 'admin.permission.manage' },
  { name: 'Staff Tasks', path: '/admin/staff/tasks', icon: ListTodo, permission: ['staff.view', 'hr.performance.manage'], requireAll: true },
  { name: 'Performance', path: '/admin/staff/performance', icon: BarChart3, permission: 'hr.performance.manage' },
]

const AdminSidebar = () => {
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

  return (
    <div
      className={`luxe-panel ${isCollapsed ? 'w-16' : 'w-[13.25rem]'} h-[calc(100vh-1.5rem)] sticky top-3 ml-3 flex flex-col transition-all duration-200`}
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
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="metal-button p-2 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-base">{isCollapsed ? '→' : '←'}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon;
            const displayName = isWarehouseFocusedUser && item.path === '/admin'
              ? 'Warehouse Overview'
              : item.name
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative block"
                title={isCollapsed ? displayName : ''}
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
