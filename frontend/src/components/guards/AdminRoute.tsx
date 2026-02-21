import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { canAccessAdmin } from '@/lib/permissions'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!canAccessAdmin(user?.role, user?.permissions)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminRoute
