import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/services/auth'

interface NavItem {
  name: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: '📊' },
  { name: 'Books', path: '/admin/books', icon: '📚' },
  { name: 'Orders', path: '/admin/orders', icon: '📦' },
  { name: 'Users', path: '/admin/users', icon: '👥' },
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
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r h-screen sticky top-0 flex flex-col transition-all duration-300`}
    >
      {/* Logo/Title & Toggle */}
      <div className="p-6 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your store</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative"
                title={isCollapsed ? item.name : ''}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r"
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      {!isCollapsed && user && (
        <div className="p-4 border-t bg-gray-50">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Collapsed User Info */}
      {isCollapsed && user && (
        <div className="p-4 border-t bg-gray-50 flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <span className="text-xl">🚪</span>
          </button>
        </div>
      )}

      {/* Bottom Section */}
      <div className={`p-4 border-t bg-gray-50 ${isCollapsed ? 'text-center' : ''}`}>
        <div className="text-xs text-gray-500">
          <p>{isCollapsed ? 'v1.0' : 'Bookstore Admin v1.0'}</p>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar
