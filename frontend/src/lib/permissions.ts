import { useAuthStore } from '@/store/auth.store'

export const isPrivilegedRole = (role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | undefined): boolean =>
  role === 'ADMIN' || role === 'SUPER_ADMIN'

export const hasPermission = (permissions: string[] | undefined, key: string): boolean => {
  if (!permissions || permissions.length === 0) {
    return false
  }

  if (permissions.includes('*')) {
    return true
  }

  return permissions.includes(key)
}

const ADMIN_PORTAL_PERMISSION_KEYS = new Set([
  'staff.view',
  'staff.manage',
  'hr.staff.create',
  'hr.staff.update',
  'hr.performance.manage',
  'warehouse.view',
  'warehouse.stock.update',
  'warehouse.transfer',
  'warehouse.purchase_request.view',
  'warehouse.purchase_request.create',
  'warehouse.purchase_request.complete',
  'finance.reports.view',
  'finance.payout.manage',
  'finance.audit.view',
  'finance.transaction.export',
  'finance.purchase_request.review',
  'finance.purchase_request.approve',
  'finance.purchase_request.reject',
])

const CS_PORTAL_PERMISSION_KEYS = new Set([
  'support.inquiries.view',
  'support.inquiries.reply',
  'support.inquiries.assign',
  'support.inquiries.escalate',
  'marketing.inquiries.view',
  'marketing.inquiries.reply',
  'marketing.inquiries.manage',
  'support.messages.view',
  'support.messages.reply',
  'support.messages.resolve',
])

export const canAccessAdmin = (role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | undefined, permissions?: string[]): boolean => {
  if (isPrivilegedRole(role)) {
    return true
  }

  if (!permissions || permissions.length === 0) {
    return false
  }

  return permissions.some((key) => ADMIN_PORTAL_PERMISSION_KEYS.has(key))
}

export const canAccessCS = (role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | undefined, permissions?: string[]): boolean => {
  if (isPrivilegedRole(role)) {
    return true
  }

  if (!permissions || permissions.length === 0) {
    return false
  }

  return permissions.some((key) => CS_PORTAL_PERMISSION_KEYS.has(key))
}

export const useHasPermission = (key: string): boolean => {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return false
  }

  if (isPrivilegedRole(user.role)) {
    return true
  }

  return hasPermission(user.permissions, key)
}
