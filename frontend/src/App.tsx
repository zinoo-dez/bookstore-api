import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/guards/ProtectedRoute'
import AdminRoute from '@/components/guards/AdminRoute'
import CSRoute from '@/components/guards/CSRoute'
import PermissionRoute from '@/components/guards/PermissionRoute'
import ScrollToTop from '@/components/ScrollToTop'
import { canAccessAdmin, canAccessCS, hasPermission } from '@/lib/permissions'

const Layout = lazy(() => import('@/components/layout/Layout'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const CSLayout = lazy(() => import('@/components/cs/CSLayout'))

const HomePage = lazy(() => import('@/pages/HomePage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const BooksPage = lazy(() => import('@/pages/BooksPage'))
const BookDetailPage = lazy(() => import('@/pages/BookDetailPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const ProfileSettingsPage = lazy(() => import('@/pages/ProfileSettingsPage'))
const LibraryPage = lazy(() => import('@/pages/LibraryPage'))
const MyBooksPage = lazy(() => import('@/pages/MyBooksPage'))
const BookReaderPage = lazy(() => import('@/pages/BookReaderPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const ContactSupportPage = lazy(() => import('@/pages/ContactSupportPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const AuthorBlogsPage = lazy(() => import('@/pages/AuthorBlogsPage'))
const BlogWritePage = lazy(() => import('@/pages/BlogWritePage'))
const BlogDetailPage = lazy(() => import('@/pages/BlogDetailPage'))
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const PortalSelectPage = lazy(() => import('@/pages/PortalSelectPage'))

const CSDashboardPage = lazy(() => import('@/pages/cs/CSDashboardPage'))
const CSInboxPage = lazy(() => import('@/pages/cs/CSInboxPage'))
const CSInquiryDetailPage = lazy(() => import('@/pages/cs/CSInquiryDetailPage'))
const CSEscalationsPage = lazy(() => import('@/pages/cs/CSEscalationsPage'))
const CSKnowledgePage = lazy(() => import('@/pages/cs/CSKnowledgePage'))
const CSTeamPage = lazy(() => import('@/pages/cs/CSTeamPage'))

const AdminBooksPage = lazy(() => import('@/pages/admin/AdminBooksPage'))
const AdminBooksBinPage = lazy(() => import('@/pages/admin/AdminBooksBinPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminWarehousesPage = lazy(() => import('@/pages/admin/AdminWarehousesPage'))
const AdminStaffPage = lazy(() => import('@/pages/admin/AdminStaffPage'))
const AdminDepartmentsPage = lazy(() => import('@/pages/admin/AdminDepartmentsPage'))
const AdminRolesPermissionsPage = lazy(() => import('@/pages/admin/AdminRolesPermissionsPage'))
const AdminStaffTasksPage = lazy(() => import('@/pages/admin/AdminStaffTasksPage'))
const AdminPerformancePage = lazy(() => import('@/pages/admin/AdminPerformancePage'))
const HRDashboardPage = lazy(() => import('@/pages/admin/HRDashboardPage'))
const WarehouseDashboardPage = lazy(() => import('@/pages/admin/WarehouseDashboardPage'))
const AdminDeliveryPage = lazy(() => import('@/pages/admin/AdminDeliveryPage'))
const AdminPurchaseRequestsPage = lazy(() => import('@/pages/admin/AdminPurchaseRequestsPage'))
const AdminPurchaseOrdersPage = lazy(() => import('@/pages/admin/AdminPurchaseOrdersPage'))
const AdminVendorsPage = lazy(() => import('@/pages/admin/AdminVendorsPage'))
const AdminBookDistributionPage = lazy(() => import('@/pages/admin/AdminBookDistributionPage'))
const AdminStoresPage = lazy(() => import('@/pages/admin/AdminStoresPage'))
const AdminInquiriesPage = lazy(() => import('@/pages/admin/AdminInquiriesPage'))
const AdminPromotionsPage = lazy(() => import('@/pages/admin/AdminPromotionsPage'))

function App() {
  const { isAuthenticated, user, token, portalMode, updateUser } = useAuthStore()
  const [permissionsSyncReady, setPermissionsSyncReady] = useState(!isAuthenticated)

  useEffect(() => {
    let active = true

    const syncPermissions = async () => {
      if (!isAuthenticated || !token || !user) {
        if (active) setPermissionsSyncReady(true)
        return
      }

      try {
        const response = await api.get('/auth/me/permissions')
        const payload = response.data as {
          role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          permissions?: string[]
        }

        if (!active) return

        updateUser({
          ...user,
          role: payload.role ?? user.role,
          permissions: payload.permissions ?? user.permissions ?? [],
        })
      } catch {
        // 401 is handled globally in api interceptor (auto logout + redirect)
      } finally {
        if (active) setPermissionsSyncReady(true)
      }
    }

    setPermissionsSyncReady(false)
    void syncPermissions()

    return () => {
      active = false
    }
  }, [isAuthenticated, token, user?.id, updateUser])

  if (!permissionsSyncReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900">
          Syncing session...
        </div>
      </div>
    )
  }

  const canUseAdmin = canAccessAdmin(user?.role, user?.permissions)
  const canUseCS = canAccessCS(user?.role, user?.permissions)
  const hasStaffPortalAccess = canUseAdmin || canUseCS
  const isStaffLinkedUser = !!user?.isStaff
  const isBuyerSession =
    user?.role === 'USER' && !isStaffLinkedUser && portalMode === 'buyer'
  const staffPortalPath =
    canUseAdmin && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
      ? '/admin'
      : canUseCS
        ? '/cs'
        : '/admin'
  const isDualPortalUser =
    user?.role === 'USER' && !isStaffLinkedUser && canUseAdmin && !canUseCS
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

  const routeFallback = (
    <div className="grid min-h-screen place-items-center bg-gray-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900">
        Loading page...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ScrollToTop />
      <Suspense fallback={routeFallback}>
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={
              isAuthenticated && canUseCS && (user?.role === 'USER' || isStaffLinkedUser)
                ? <Navigate to="/cs" replace />
                : isAuthenticated && isDualPortalUser && !portalMode
                  ? <Navigate to="/portal-select" replace />
                  : isAuthenticated && hasStaffPortalAccess && (!isBuyerSession || isStaffLinkedUser)
                    ? <Navigate to={staffPortalPath} replace />
                    : <HomePage />
            } />
            <Route
              path="login"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
              }
            />
            <Route
              path="register"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
              }
            />
            <Route
              path="portal-select"
              element={
                isAuthenticated && isDualPortalUser
                  ? <PortalSelectPage />
                  : <Navigate to="/" replace />
              }
            />
            <Route path="books" element={
              hasStaffPortalAccess && !isBuyerSession
                ? <Navigate to={canUseAdmin ? "/admin/books" : staffPortalPath} replace />
                : <BooksPage />
            } />
            <Route path="books/:id" element={
              hasStaffPortalAccess && !isBuyerSession
                ? <Navigate to={canUseAdmin ? "/admin/books" : staffPortalPath} replace />
                : <BookDetailPage />
            } />
            <Route path="contact" element={<ContactPage />} />
            <Route path="contact/support" element={<ContactSupportPage />} />
            <Route path="contact/authors" element={<Navigate to="/contact/support" replace />} />
            <Route path="contact/publishers" element={<Navigate to="/contact/support" replace />} />
            <Route path="contact/business" element={<Navigate to="/contact/support" replace />} />
            <Route path="contact/legal" element={<Navigate to="/contact/support" replace />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="author-blogs" element={<Navigate to="/blogs" replace />} />
            <Route path="blogs" element={<AuthorBlogsPage />} />
            <Route path="blogs/:id" element={<BlogDetailPage />} />
            <Route
              path="blogs/write"
              element={
                <ProtectedRoute>
                  <BlogWritePage />
                </ProtectedRoute>
              }
            />
            <Route path="user/:id" element={<UserProfilePage />} />
            <Route
              path="cart"
              element={
                hasStaffPortalAccess && !isBuyerSession
                  ? <Navigate to={staffPortalPath} replace />
                  : <ProtectedRoute><CartPage /></ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                hasStaffPortalAccess && !isBuyerSession
                  ? <Navigate to={staffPortalPath} replace />
                  : <ProtectedRoute><CheckoutPage /></ProtectedRoute>
              }
            />
            <Route
              path="order-confirmation/:orderId"
              element={
                hasStaffPortalAccess && !isBuyerSession
                  ? <Navigate to={staffPortalPath} replace />
                  : <ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                hasStaffPortalAccess && !isBuyerSession
                  ? <Navigate to={canUseAdmin ? "/admin/orders" : staffPortalPath} replace />
                  : <ProtectedRoute><OrdersPage /></ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfileSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="library"
              element={
                <ProtectedRoute>
                  <LibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reading-insights"
              element={
                <ProtectedRoute>
                  <MyBooksPage />
                </ProtectedRoute>
              }
            />
            <Route path="my-books" element={<Navigate to="/reading-insights" replace />} />
            <Route
              path="my-books/:id/read"
              element={
                <ProtectedRoute>
                  <BookReaderPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Customer Service Routes */}
          <Route
            path="/cs"
            element={
              <CSRoute>
                <CSLayout />
              </CSRoute>
            }
          >
            <Route index element={<CSDashboardPage />} />
            <Route path="inbox" element={<CSInboxPage mode="inbox" />} />
            <Route path="inquiries" element={<CSInboxPage mode="inquiries" />} />
            <Route path="inquiries/:id" element={<CSInquiryDetailPage />} />
            <Route path="escalations" element={<CSEscalationsPage />} />
            <Route path="team" element={<CSTeamPage />} />
            <Route path="knowledge" element={<CSKnowledgePage />} />
          </Route>

          {/* Admin Routes with Admin Layout */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route
              index
              element={
                isHrFocusedUser
                  ? <HRDashboardPage />
                  : isWarehouseFocusedUser
                    ? <WarehouseDashboardPage />
                    : <AdminPage />
              }
            />
            <Route
              path="books"
              element={
                user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
                  ? <AdminBooksPage />
                  : <Navigate to="/admin" replace />
              }
            />
            <Route
              path="books/bin"
              element={
                user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
                  ? <AdminBooksBinPage />
                  : <Navigate to="/admin" replace />
              }
            />
            <Route
              path="bin"
              element={
                user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
                  ? <AdminBooksBinPage />
                  : <Navigate to="/admin" replace />
              }
            />
            <Route
              path="orders"
              element={
                <PermissionRoute permission="finance.reports.view">
                  <AdminOrdersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="promotions"
              element={
                <PermissionRoute permission="finance.payout.manage">
                  <AdminPromotionsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="users"
              element={
                user?.role === 'ADMIN'
                  || user?.role === 'SUPER_ADMIN'
                  ? <AdminUsersPage />
                  : <Navigate to="/admin" replace />
              }
            />
            <Route
              path="delivery"
              element={
                <PermissionRoute permission="warehouse.purchase_order.view">
                  <AdminDeliveryPage />
                </PermissionRoute>
              }
            />
            <Route
              path="warehouses"
              element={
                <PermissionRoute permission="warehouse.view">
                  <AdminWarehousesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="book-distribution"
              element={
                <PermissionRoute permission="warehouse.view">
                  <AdminBookDistributionPage />
                </PermissionRoute>
              }
            />
            <Route
              path="stores"
              element={
                <PermissionRoute permission="warehouse.view">
                  <AdminStoresPage />
                </PermissionRoute>
              }
            />
            <Route
              path="vendors"
              element={
                <PermissionRoute
                  permission={['warehouse.view', 'warehouse.vendor.manage']}
                  requireAll={false}
                >
                  <AdminVendorsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="purchase-requests"
              element={
                <PermissionRoute
                  permission={[
                    'warehouse.purchase_request.view',
                    'finance.purchase_request.review',
                    'finance.purchase_request.approve',
                    'finance.purchase_request.reject',
                  ]}
                  requireAll={false}
                >
                  <AdminPurchaseRequestsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="purchase-orders"
              element={
                <PermissionRoute
                  permission={[
                    'warehouse.purchase_order.view',
                    'finance.purchase_order.view',
                    'warehouse.purchase_order.create',
                    'warehouse.purchase_order.receive',
                  ]}
                  requireAll={false}
                >
                  <AdminPurchaseOrdersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="staff"
              element={
                <PermissionRoute permission="staff.view">
                  <AdminStaffPage />
                </PermissionRoute>
              }
            />
            <Route
              path="staff/departments"
              element={
                <PermissionRoute permission={['staff.manage', 'staff.view']} requireAll>
                  <AdminDepartmentsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="staff/roles"
              element={
                <PermissionRoute permission="admin.permission.manage">
                  <AdminRolesPermissionsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="staff/tasks"
              element={
                <PermissionRoute permission={['staff.view', 'hr.performance.manage']} requireAll>
                  <AdminStaffTasksPage />
                </PermissionRoute>
              }
            />
            <Route
              path="staff/performance"
              element={
                <PermissionRoute permission="hr.performance.manage">
                  <AdminPerformancePage />
                </PermissionRoute>
              }
            />
            <Route
              path="inquiries"
              element={
                user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
                  ? <AdminInquiriesPage />
                  : <Navigate to="/admin" replace />
              }
            />
          </Route>
          </Routes>
        </Suspense>
    </div>
  )
}

export default App
