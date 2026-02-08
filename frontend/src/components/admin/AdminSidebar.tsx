import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/services/auth'
import { LayoutDashboard,
  BookOpen,
  Package,
  Users,
  LogOut,
  LucideIcon
} from "lucide-react";

interface NavItem {
  name: string
  path: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Books', path: '/admin/books', icon: BookOpen },
  { name: 'Orders', path: '/admin/orders', icon: Package },
  { name: 'Users', path: '/admin/users', icon: Users },
]

const AdminSidebar = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuthStore()
  const logoutMutation = useLogout()

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return (
    <div 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r h-screen sticky top-0 flex flex-col transition-all duration-300 dark:bg-slate-900 dark:border-slate-800`}
    >
      {/* Logo/Title & Toggle */}
      <div className="p-6 border-b flex items-center justify-between dark:border-slate-800">
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Admin Panel</h2>
            <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">Manage your store</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-slate-800"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-xl">{isCollapsed ? '→' : '←'}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative"
                title={isCollapsed ? item.name : ''}
              >
               <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors
                  ${isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-amber-900/30 dark:text-amber-200"
                    : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-300"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                {/* ICON */}
                <Icon
                  className={`h-5 w-5 flex-shrink-0
                    ${isActive ? "text-primary-600 dark:text-amber-300" : "text-gray-500 dark:text-slate-400"}
                  `}
                />

                {/* LABEL */}
                {!isCollapsed && (
                  <span className="text-sm font-medium">
                    {item.name}
                  </span>
                )}

                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-primary-600 dark:bg-amber-300" />
                )}
              </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      {!isCollapsed && user && (
        <div className="p-4 border-t bg-gray-50 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded dark:bg-purple-900/40 dark:text-purple-200">
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Collapsed User Info */}
      {isCollapsed && user && (
        <div className="p-4 border-t bg-gray-50 flex flex-col items-center gap-2 dark:border-slate-800 dark:bg-slate-950">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-950/40"
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      )}

      {/* Bottom Section */}
      <div className={`p-4 border-t bg-gray-50 ${isCollapsed ? 'text-center' : ''} dark:border-slate-800 dark:bg-slate-950`}>
        <div className="text-xs text-gray-500 dark:text-slate-500">
          <p>{isCollapsed ? 'v1.0' : 'Bookstore Admin v1.0'}</p>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar
