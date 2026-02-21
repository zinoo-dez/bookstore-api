import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/lib/permissions'

interface CSRouteProps {
  children: React.ReactNode
}

const CSRoute = ({ children }: CSRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const allowed = hasPermission(user?.permissions, 'support.inquiries.view')
    || hasPermission(user?.permissions, 'marketing.inquiries.view')
    || hasPermission(user?.permissions, 'marketing.inquiries.reply')
    || hasPermission(user?.permissions, 'marketing.inquiries.manage')
    || hasPermission(user?.permissions, 'support.messages.view')
    || user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'

  if (!allowed) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default CSRoute
