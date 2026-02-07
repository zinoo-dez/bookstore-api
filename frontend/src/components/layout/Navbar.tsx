import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useCart } from '@/services/cart'
import { useLogout } from '@/services/auth'
import Avatar from '@/components/user/Avatar'

const Navbar = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { data: cartData } = useCart()
  const navigate = useNavigate()
  const logoutMutation = useLogout()

  const totalItems = cartData?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const handleLogout = () => {
    logoutMutation.mutate()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold text-primary-600"
            >
              📚 Bookstore
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Only show user navigation if not admin */}
            {user?.role !== 'ADMIN' && (
              <>
                <Link
                  to="/books"
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  Books
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                  >
                    Orders
                  </Link>
                )}
              </>
            )}

            {/* Show Admin link for admins */}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
              >
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Cart - Only show for regular users, not admins */}
                {user?.role !== 'ADMIN' && (
                  <Link to="/cart" className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <span className="text-2xl">🛒</span>
                      {totalItems > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                        >
                          {totalItems}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>
                )}

                {/* User menu */}
                <div className="flex items-center space-x-3">
                  <Link to="/profile">
                    <Avatar
                      avatarType={user?.avatarType}
                      avatarValue={user?.avatarValue}
                      backgroundColor={user?.backgroundColor}
                      size="md"
                      className="cursor-pointer hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 transition-all"
                    />
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar