import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'
export type StaffTaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'
export type StaffTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Department {
  id: string
  name: string
  code: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    staffProfiles: number
    staffRoles: number
  }
}

export interface StaffPermission {
  id: string
  key: string
  description?: string | null
}

export interface StaffRole {
  id: string
  code?: string | null
  name: string
  departmentId?: string | null
  isSystem: boolean
  permissions: Array<{
    permission: StaffPermission
  }>
  _count?: {
    assignments: number
  }
}

export interface StaffProfile {
  id: string
  userId: string
  departmentId: string
  employeeCode: string
  title: string
  managerId?: string | null
  status: StaffStatus
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
  department: Department
  assignments: Array<{
    id: string
    roleId: string
    effectiveFrom: string
    effectiveTo?: string | null
    role: StaffRole
  }>
  _count?: {
    tasks: number
  }
}

export interface StaffCandidate {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
}

export interface StaffTask {
  id: string
  staffId: string
  type: string
  status: StaffTaskStatus
  priority: StaffTaskPriority
  metadata?: Record<string, unknown> | null
  createdAt: string
  completedAt?: string | null
  staff: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    department: {
      id: string
      name: string
      code: string
    }
  }
}

export interface ElevatedAccount {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt: string
  staffProfile: null | {
    id: string
    title: string
    status: StaffStatus
    department: {
      id: string
      name: string
      code: string
    }
  }
}

export interface StaffPerformanceResponse {
  summary: {
    totalTasks: number
    completedTasks: number
    completionRate: number
    statusCounts: Record<string, number>
  }
  byDepartment: Array<{
    departmentId: string
    departmentName: string
    total: number
    completed: number
    completionRate: number
  }>
  byStaff: Array<{
    staffId: string
    name: string
    departmentName: string
    total: number
    completed: number
    completionRate: number
  }>
}

export interface CommercialPerformanceResponse {
  summary: {
    buyersCount: number
    booksTracked: number
    totalRevenue: number
    totalOrders: number
  }
  period: {
    fromDate: string | null
    toDate: string | null
    limit: number
  }
  topBuyers: Array<{
    userId: string
    name: string
    email: string
    orderCount: number
    totalSpend: number
  }>
  topBooksByUnits: Array<{
    bookId: string
    title: string
    author: string
    isbn: string
    units: number
    revenue: number
  }>
  topBooksByRevenue: Array<{
    bookId: string
    title: string
    author: string
    isbn: string
    units: number
    revenue: number
  }>
}

export const useDepartments = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['staff-departments'],
    queryFn: async (): Promise<Department[]> => {
      const response = await api.get('/admin/departments')
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCreateDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<Department>) => {
      const response = await api.post('/admin/departments', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-departments'] })
    },
  })
}

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Department> }) => {
      const response = await api.patch(`/admin/departments/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-departments'] })
    },
  })
}

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/departments/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-departments'] })
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useRoles = (departmentId?: string) =>
  useQuery({
    queryKey: ['staff-roles', departmentId || 'all'],
    queryFn: async (): Promise<StaffRole[]> => {
      const response = await api.get('/admin/staff/roles', {
        params: departmentId ? { departmentId } : undefined,
      })
      return response.data
    },
  })

export const useElevatedAccounts = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['staff-elevated-accounts'],
    queryFn: async (): Promise<ElevatedAccount[]> => {
      const response = await api.get('/admin/staff/account-access/admins')
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const usePermissions = () =>
  useQuery({
    queryKey: ['staff-permissions'],
    queryFn: async (): Promise<StaffPermission[]> => {
      const response = await api.get('/admin/staff/permissions')
      return response.data
    },
  })

export const useCreateRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string; code?: string; departmentId?: string; isSystem?: boolean }) => {
      const response = await api.post('/admin/staff/roles', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-roles'] })
    },
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffRole> }) => {
      const response = await api.patch(`/admin/staff/roles/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-roles'] })
    },
  })
}

export const useReplaceRolePermissions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, permissionKeys }: { id: string; permissionKeys: string[] }) => {
      const response = await api.post(`/admin/staff/roles/${id}/permissions`, {
        permissionKeys,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-roles'] })
    },
  })
}

export const useStaffProfiles = (filters?: {
  departmentId?: string
  roleId?: string
  status?: StaffStatus
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['staff-profiles', filters?.departmentId || 'all', filters?.roleId || 'all', filters?.status || 'all'],
    queryFn: async (): Promise<StaffProfile[]> => {
      const response = await api.get('/admin/staff', { params: filters })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCreateStaffProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      userId: string
      departmentId: string
      employeeCode: string
      title: string
      managerId?: string
      status?: StaffStatus
    }) => {
      const response = await api.post('/admin/staff', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useStaffCandidates = (q?: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['staff-candidates', q || ''],
    queryFn: async (): Promise<StaffCandidate[]> => {
      const response = await api.get('/admin/staff/candidates', {
        params: q?.trim() ? { q: q.trim() } : undefined,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
  })

export const useHireExistingUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      userId: string
      departmentId: string
      employeeCode?: string
      title: string
      managerId?: string
      status?: StaffStatus
      roleIds?: string[]
    }) => {
      const response = await api.post('/admin/staff/hire-existing', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['staff-candidates'] })
    },
  })
}

export const useCreateStaffAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      email: string
      departmentId: string
      employeeCode?: string
      title: string
      managerId?: string
      status?: StaffStatus
      roleIds?: string[]
      sendActivationEmail?: boolean
      convertExisting?: boolean
    }) => {
      const response = await api.post('/admin/staff/create-account', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['staff-candidates'] })
    },
  })
}

export const useUpdateStaffProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffProfile> }) => {
      const response = await api.patch(`/admin/staff/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useUpdateStaffAccountAccess = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: string
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    }) => {
      const response = await api.patch(`/admin/staff/${id}/account-access`, { role })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useAssignRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ staffId, roleId }: { staffId: string; roleId: string }) => {
      const response = await api.post(`/admin/staff/${staffId}/roles`, { roleId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useTasks = (filters?: {
  departmentId?: string
  staffId?: string
  status?: StaffTaskStatus
  priority?: StaffTaskPriority
}) =>
  useQuery({
    queryKey: [
      'staff-tasks',
      filters?.departmentId || 'all',
      filters?.staffId || 'all',
      filters?.status || 'all',
      filters?.priority || 'all',
    ],
    queryFn: async (): Promise<StaffTask[]> => {
      const response = await api.get('/admin/staff/tasks', { params: filters })
      return response.data
    },
  })

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      staffId: string
      type: string
      status?: StaffTaskStatus
      priority?: StaffTaskPriority
      metadata?: Record<string, unknown>
    }) => {
      const response = await api.post('/admin/staff/tasks', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['staff-performance'] })
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useCompleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.post(`/admin/staff/tasks/${taskId}/complete`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['staff-performance'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
}

export const useStaffPerformance = (
  filters?: {
    departmentId?: string
    staffId?: string
    fromDate?: string
    toDate?: string
  },
  options?: {
    enabled?: boolean
  },
) =>
  useQuery({
    queryKey: [
      'staff-performance',
      filters?.departmentId || 'all',
      filters?.staffId || 'all',
      filters?.fromDate || 'all',
      filters?.toDate || 'all',
    ],
    queryFn: async (): Promise<StaffPerformanceResponse> => {
      const response = await api.get('/admin/staff/performance', { params: filters })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCommercialPerformance = (
  filters?: {
    fromDate?: string
    toDate?: string
    limit?: number
  },
  options?: {
    enabled?: boolean
  },
) =>
  useQuery({
    queryKey: [
      'staff-performance-commercial',
      filters?.fromDate || 'all',
      filters?.toDate || 'all',
      filters?.limit || 5,
    ],
    queryFn: async (): Promise<CommercialPerformanceResponse> => {
      const response = await api.get('/admin/staff/performance/commercial', {
        params: filters,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useStaffAuditLogs = (staffId?: string) =>
  useQuery({
    queryKey: ['staff-audit', staffId || 'none'],
    queryFn: async () => {
      const response = await api.get(`/admin/staff/${staffId}/audit`)
      return response.data
    },
    enabled: !!staffId,
    retry: false,
  })
