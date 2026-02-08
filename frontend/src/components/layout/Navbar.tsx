import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useCart } from '@/services/cart'
import { useLogout } from '@/services/auth'
import Logo from "@/components/ui/Logo";
import Avatar from '@/components/user/Avatar'
import { useTheme } from '@/hooks/useTheme'

const Navbar = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { data: cartData } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const logoutMutation = useLogout()
  const { theme, toggleTheme } = useTheme()

  const totalItems = cartData?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const handleLogout = () => {
    logoutMutation.mutate()
    navigate('/')
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const navLinkClass = (path: string) =>
    isActive(path)
      ? `
        text-sm font-bold
        text-slate-900 dark:text-slate-100
        relative
        after:absolute after:-bottom-2 after:left-0
        after:h-0.5 after:w-full
        after:bg-primary-600
        dark:after:bg-[#E6B65C]
      `
    : `
        text-sm font-semibold
        text-slate-700 dark:text-slate-300
        hover:text-primary-600
        dark:hover:text-[#E6B65C]
        transition-colors
      `

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="
                flex items-center
                text-slate-900
                dark:text-[#E6B65C]
                dark:drop-shadow-[0_0_6px_rgba(230,182,92,0.35)]
                transition-colors
              ">
              <Logo />
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Only show user navigation if not admin */}
            {user?.role !== 'ADMIN' && (
              <>
                <Link
                  to="/books"
                  className={navLinkClass('/books')}
                >
                  Books
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className={navLinkClass('/orders')}
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
                className={navLinkClass('/admin')}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={theme === 'dark'}
                className="
                  relative inline-flex h-9 w-14 items-center
                  rounded-full
                  border border-slate-200
                  bg-slate-100
                  transition-colors
                  hover:bg-slate-200
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:hover:bg-slate-800
                "
              >
                <span className="sr-only">Toggle theme</span>

                <span
                  className={`
                    inline-flex h-7 w-7 items-center justify-center
                    transform rounded-full
                    bg-slate-100
                      text-slate-600
                      shadow-sm

                      dark:bg-[#E6B65C]
                      dark:text-slate-900
                      dark:shadow-[0_0_8px_rgba(230,182,92,0.35)]
                    transition-all
                    ${
                      theme === 'dark'
                        ? 'translate-x-6 bg-[#E6B65C] text-slate-900'
                        : 'translate-x-1'
                    }
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
            </div>
            {isAuthenticated ? (
              <>
                {/* Cart - Only show for regular users, not admins */}
                {user?.role !== 'ADMIN' && (
                  <Link to="/cart" className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="
                          p-2
                          text-slate-700
                          hover:text-primary-600
                          transition-colors

                          dark:text-slate-300
                          dark:hover:text-[#E6B65C]
                        ">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.2a2 2 0 002-1.6L21 7H7" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                      {totalItems > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold"
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
                      className="
                        cursor-pointer
                        transition-all

                        hover:ring-2
                        hover:ring-primary-500
                        hover:ring-offset-2
                        dark:hover:ring-opacity-80
                        dark:hover:ring-[#E6B65C]
                        dark:hover:ring-offset-slate-950
                      "
                    />
                  </Link>
                 <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="
                      px-4 py-2
                      text-xs font-semibold uppercase tracking-[0.2em]
                      rounded-xl
                      transition-colors

                      text-slate-700
                      border border-slate-200
                      hover:bg-slate-50

                      dark:text-slate-300
                      dark:hover:text-[#E6B65C]
                      dark:border-slate-700
                      dark:hover:bg-slate-800
                    "
                  >
                    Logout
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
  <Link
    to="/login"
    className="
      text-sm font-semibold transition-colors

      text-slate-700
      hover:text-primary-600

      dark:text-slate-400
      dark:hover:text-[#E6B65C]
    "
  >
    Login
  </Link>

  <Link
  to="/register"
  className="
    px-4 py-2
    rounded-xl
    text-xs font-semibold uppercase tracking-[0.2em]
    transition-all

    /* Day mode */
    bg-primary-600 text-white
    hover:bg-primary-700
    shadow-lg shadow-primary-200/60

    /* Night mode */
    dark:bg-gold
    dark:hover:bg-gold-hover
    dark:text-slate-900
    dark:shadow-[0_0_10px_rgba(218,155,46,0.4)]
  "
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
