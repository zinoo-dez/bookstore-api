import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import Layout from '@/components/layout/Layout'
import AdminLayout from '@/components/admin/AdminLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import BooksPage from '@/pages/BooksPage'
import BookDetailPage from '@/pages/BookDetailPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderConfirmationPage from '@/pages/OrderConfirmationPage'
import OrdersPage from '@/pages/OrdersPage'
import AdminPage from '@/pages/AdminPage'
import AdminBooksPage from '@/pages/admin/AdminBooksPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import ProtectedRoute from '@/components/guards/ProtectedRoute'
import AdminRoute from '@/components/guards/AdminRoute'
import ProfileSettingsPage from '@/pages/ProfileSettingsPage'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={
              isAuthenticated && user?.role === 'ADMIN'
                ? <Navigate to="/admin" replace />
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
            <Route path="books" element={
              user?.role === 'ADMIN'
                ? <Navigate to="/admin/books" replace />
                : <BooksPage />
            } />
            <Route path="books/:id" element={
              user?.role === 'ADMIN'
                ? <Navigate to="/admin/books" replace />
                : <BookDetailPage />
            } />
            <Route
              path="cart"
              element={
                user?.role === 'ADMIN'
                  ? <Navigate to="/admin" replace />
                  : <ProtectedRoute><CartPage /></ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                user?.role === 'ADMIN'
                  ? <Navigate to="/admin" replace />
                  : <ProtectedRoute><CheckoutPage /></ProtectedRoute>
              }
            />
            <Route
              path="order-confirmation/:orderId"
              element={
                user?.role === 'ADMIN'
                  ? <Navigate to="/admin" replace />
                  : <ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                user?.role === 'ADMIN'
                  ? <Navigate to="/admin/orders" replace />
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
            <Route index element={<AdminPage />} />
            <Route path="books" element={<AdminBooksPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
