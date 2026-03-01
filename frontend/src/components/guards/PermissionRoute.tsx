import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission, isPrivilegedRole } from '@/lib/permissions'

interface PermissionRouteProps {
  permission: string | string[]
  requireAll?: boolean
  children: React.ReactNode
}

const PermissionRoute = ({ permission, requireAll = true, children }: PermissionRouteProps) => {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  let allowed = isPrivilegedRole(user.role)
  if (!allowed) {
    const permissions = Array.isArray(permission) ? permission : [permission]
    allowed = requireAll
      ? permissions.every((key) => hasPermission(user.permissions, key))
      : permissions.some((key) => hasPermission(user.permissions, key))
  }

  if (!allowed) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

export default PermissionRoute
