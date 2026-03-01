import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useCart } from '@/services/cart'
import { useLogout } from '@/services/auth'
import { canAccessAdmin } from '@/lib/permissions'
import Logo from "@/components/ui/Logo";
import Avatar from '@/components/user/Avatar'
import { useTheme } from '@/hooks/useTheme'
import NotificationBell from './NotificationBell'

const Navbar = () => {
  const { user, isAuthenticated } = useAuthStore()
  const canUseAdmin = canAccessAdmin(user?.role, user?.permissions)
  const { data: cartData } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const logoutMutation = useLogout()
  const { theme, toggleTheme } = useTheme()
  const [isLibraryMenuOpen, setIsLibraryMenuOpen] = useState(false)
  const [isBookstoreMenuOpen, setIsBookstoreMenuOpen] = useState(false)
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const libraryMenuCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bookstoreMenuCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollY = useRef(0)

  const totalItems = cartData?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const handleLogout = () => {
    logoutMutation.mutate()
    navigate('/')
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const isLibrarySectionActive = isActive('/library') || isActive('/reading-insights')
  const isBookstoreSectionActive = isActive('/books') || isActive('/orders') || isActive('/cart')

  const openLibraryMenu = () => {
    if (libraryMenuCloseTimeout.current) {
      clearTimeout(libraryMenuCloseTimeout.current)
      libraryMenuCloseTimeout.current = null
    }
    setIsLibraryMenuOpen(true)
  }

  const closeLibraryMenuWithDelay = () => {
    if (libraryMenuCloseTimeout.current) {
      clearTimeout(libraryMenuCloseTimeout.current)
    }
    libraryMenuCloseTimeout.current = setTimeout(() => {
      setIsLibraryMenuOpen(false)
    }, 200)
  }

  const openBookstoreMenu = () => {
    if (bookstoreMenuCloseTimeout.current) {
      clearTimeout(bookstoreMenuCloseTimeout.current)
      bookstoreMenuCloseTimeout.current = null
    }
    setIsBookstoreMenuOpen(true)
  }

  const closeBookstoreMenuWithDelay = () => {
    if (bookstoreMenuCloseTimeout.current) {
      clearTimeout(bookstoreMenuCloseTimeout.current)
    }
    bookstoreMenuCloseTimeout.current = setTimeout(() => {
      setIsBookstoreMenuOpen(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (libraryMenuCloseTimeout.current) {
        clearTimeout(libraryMenuCloseTimeout.current)
      }
      if (bookstoreMenuCloseTimeout.current) {
        clearTimeout(bookstoreMenuCloseTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    lastScrollY.current = window.scrollY
    setIsAtTop(window.scrollY <= 12)

    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastScrollY.current
      // Hysteresis avoids rapid flip-flop around the threshold.
      if (isAtTop) {
        if (currentY > 40) setIsAtTop(false)
      } else if (currentY < 10) {
        setIsAtTop(true)
      }

      if (Math.abs(delta) < 6) return

      if (currentY <= 24) {
        setIsNavbarVisible(true)
        lastScrollY.current = currentY
        return
      }

      if (delta > 0 && currentY > 80) {
        setIsNavbarVisible(false)
        setIsLibraryMenuOpen(false)
        setIsBookstoreMenuOpen(false)
      } else if (delta < 0) {
        setIsNavbarVisible(true)
      }

      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isAtTop])

  useEffect(() => {
    setIsNavbarVisible(true)
    if (typeof window !== 'undefined') {
      setIsAtTop(window.scrollY <= 12)
    }
  }, [location.pathname])

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

  const menuPanelClass = (isOpen: boolean) => `
    luxe-panel absolute left-0 top-full z-40 mt-3 w-56 p-1.5
    bg-white/95 dark:bg-slate-900/95
    transition-all duration-200
    ${isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}
  `

  const menuItemClass = (active: boolean) => `
    block rounded-lg px-3 py-2 text-sm font-medium transition-all
    ${
      active
        ? 'bg-primary-50 text-primary-700 dark:bg-[#E6B65C]/20 dark:text-[#E6B65C]'
        : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
    }
  `

  return (
    <div
      className={`
        sticky top-0 z-50
        transition-transform duration-390 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <header
        className={`
          luxe-glass-nav mx-auto
          transition-[width,border-radius,box-shadow,margin-top] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isAtTop ? 'mt-0 w-full rounded-none border-x-0 border-t-0' : 'mt-3 w-[min(96%,80rem)] rounded-2xl'}
        `}
      >
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
            {!canUseAdmin && (
              <>
                <div
                  className="relative"
                  onMouseEnter={openBookstoreMenu}
                  onMouseLeave={closeBookstoreMenuWithDelay}
                >
                  <Link
                    to="/books"
                    className={
                      isBookstoreSectionActive
                        ? `
                          inline-flex items-center gap-1 text-sm font-bold
                          text-slate-900 dark:text-slate-100
                          relative
                          after:absolute after:-bottom-2 after:left-0
                          after:h-0.5 after:w-full
                          after:bg-primary-600
                          dark:after:bg-[#E6B65C]
                        `
                        : `
                          inline-flex items-center gap-1 text-sm font-semibold
                          text-slate-700 dark:text-slate-300
                          hover:text-primary-600 dark:hover:text-[#E6B65C]
                          transition-colors
                        `
                    }
                  >
                    Bookstore
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isBookstoreMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                    />
                  </Link>

                  <div className={menuPanelClass(isBookstoreMenuOpen)}>
                    <Link
                      to="/books"
                      className={menuItemClass(isActive('/books'))}
                    >
                      Browse Books
                    </Link>

                    {isAuthenticated && (
                      <Link
                        to="/orders"
                        className={`mt-1 ${menuItemClass(isActive('/orders'))}`}
                      >
                        Orders
                      </Link>
                    )}

                    {isAuthenticated && (
                      <Link
                        to="/cart"
                        className={`mt-1 ${menuItemClass(isActive('/cart'))}`}
                      >
                        Cart
                      </Link>
                    )}
                  </div>
                </div>
                <Link
                  to="/contact"
                  className={navLinkClass('/contact')}
                >
                  Contact
                </Link>
                <Link
                  to="/blogs"
                  className={navLinkClass('/blogs')}
                >
                  Blogs
                </Link>
                {isAuthenticated && (
                  <div
                    className="relative"
                    onMouseEnter={openLibraryMenu}
                    onMouseLeave={closeLibraryMenuWithDelay}
                  >
                    <Link
                      to="/library"
                      className={
                        isLibrarySectionActive
                          ? `
                            inline-flex items-center gap-1 text-sm font-bold
                            text-slate-900 dark:text-slate-100
                            relative
                            after:absolute after:-bottom-2 after:left-0
                            after:h-0.5 after:w-full
                            after:bg-primary-600
                            dark:after:bg-[#E6B65C]
                          `
                          : `
                            inline-flex items-center gap-1 text-sm font-semibold
                            text-slate-700 dark:text-slate-300
                            hover:text-primary-600 dark:hover:text-[#E6B65C]
                            transition-colors
                          `
                      }
                    >
                      Library
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isLibraryMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                      />
                    </Link>

                    <div className={menuPanelClass(isLibraryMenuOpen)}>
                      <Link
                        to="/library"
                        className={menuItemClass(isActive('/library'))}
                      >
                        Open Library
                      </Link>
                      <Link
                        to="/reading-insights"
                        className={`mt-1 ${menuItemClass(isActive('/reading-insights'))}`}
                      >
                        Reading Insights
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Show Admin link for admins */}
            {canUseAdmin && (
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
                  metal-button relative inline-flex h-9 w-14 items-center
                  rounded-full transition-colors
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
                {!canUseAdmin && (
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

                <NotificationBell />

                {/* User menu */}
                <div className="flex items-center space-x-3">
                  <Link to={user?.id ? `/user/${user.id}` : '/profile'}>
                    <Avatar
                      avatarType={user?.avatarType}
                      avatarValue={user?.avatarValue ?? undefined}
                      backgroundColor={user?.backgroundColor ?? undefined}
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
                      ios-cta-secondary
                      px-4 py-2
                      text-xs font-semibold uppercase tracking-[0.2em] text-slate-100
                      rounded-xl
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
    ios-cta
    px-4 py-2
    rounded-xl
    text-xs font-semibold uppercase tracking-[0.2em] text-slate-900
    transition-all duration-200
    hover:-translate-y-0.5
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
    </div>
  )
}

export default Navbar
