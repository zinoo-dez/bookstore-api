import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '@/lib/api'
import {
  LoginData,
  RegisterData,
  authResponseSchema,
  userSchema,
  type AuthResponse,
  type User
} from '@/lib/schemas'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { jwtDecode } from 'jwt-decode'
import { canAccessAdmin, canAccessCS } from '@/lib/permissions'

interface JwtPayload {
  sub: string
  email: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isStaff?: boolean
  staffStatus?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | null
  name?: string
  permissions?: string[]
  staffRoles?: Array<{
    id?: string
    name: string
    code?: string | null
  }>
  primaryStaffRoleName?: string | null
  primaryStaffRoleCode?: string | null
  staffTitle?: string | null
  staffDepartmentName?: string | null
  staffDepartmentCode?: string | null
  staffProfileId?: string | null
  staffEmployeeCode?: string | null
  avatarType?: 'emoji' | 'upload'
  avatarValue?: string
  backgroundColor?: string
  pronouns?: string | null
  shortBio?: string | null
  about?: string | null
  coverImage?: string | null
  showEmail?: boolean
  showFollowers?: boolean
  showFollowing?: boolean
  showFavorites?: boolean
  showLikedPosts?: boolean
  supportEnabled?: boolean
  supportUrl?: string | null
  supportQrImage?: string | null
  iat: number
  exp: number
}

export const useLogin = () => {
  const queryClient = useQueryClient()
  const { login, setPortalMode } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      try {
        const response = await api.post('/auth/login', data)
        return authResponseSchema.parse(response.data)
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    onSuccess: (data) => {
      try {
        const decoded = jwtDecode<JwtPayload>(data.access_token)
        const user: User = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          role: decoded.role,
          isStaff: decoded.isStaff ?? false,
          staffStatus: decoded.staffStatus ?? null,
          permissions: decoded.permissions || [],
          staffRoles: decoded.staffRoles || [],
          primaryStaffRoleName: decoded.primaryStaffRoleName || null,
          primaryStaffRoleCode: decoded.primaryStaffRoleCode || null,
          staffTitle: decoded.staffTitle || null,
          staffDepartmentName: decoded.staffDepartmentName || null,
          staffDepartmentCode: decoded.staffDepartmentCode || null,
          staffProfileId: decoded.staffProfileId || null,
          staffEmployeeCode: decoded.staffEmployeeCode || null,
          avatarType: decoded.avatarType || 'emoji',
          avatarValue: decoded.avatarValue,
          backgroundColor: decoded.backgroundColor,
          pronouns: decoded.pronouns || null,
          shortBio: decoded.shortBio || null,
          about: decoded.about || null,
          coverImage: decoded.coverImage || null,
          showEmail: decoded.showEmail ?? false,
          showFollowers: decoded.showFollowers ?? true,
          showFollowing: decoded.showFollowing ?? true,
          showFavorites: decoded.showFavorites ?? false,
          showLikedPosts: decoded.showLikedPosts ?? false,
          supportEnabled: decoded.supportEnabled ?? false,
          supportUrl: decoded.supportUrl ?? null,
          supportQrImage: decoded.supportQrImage ?? null,
          createdAt: new Date().toISOString(),
        }
        login(user, data.access_token)
        queryClient.invalidateQueries({ queryKey: ['user'] })

        const hasAdminAccess = canAccessAdmin(decoded.role, decoded.permissions || [])
        const hasCSAccess = canAccessCS(decoded.role, decoded.permissions || [])
        const hasStaffPortalAccess = hasAdminAccess || hasCSAccess
        const isStaff = decoded.isStaff ?? false
        const staffPortalPath =
          decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN'
            ? '/admin'
            : hasCSAccess
              ? '/cs'
              : '/admin'

        if (isStaff || decoded.role !== 'USER') {
          setPortalMode('staff')
          navigate(staffPortalPath)
          return
        }

        if (decoded.role === 'USER' && hasAdminAccess && !hasCSAccess) {
          setPortalMode(null)
          navigate('/portal-select')
          return
        }

        setPortalMode(hasStaffPortalAccess ? 'staff' : 'buyer')
        navigate(hasStaffPortalAccess ? staffPortalPath : '/')
      } catch (error) {
        throw new Error('Invalid token received')
      }
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterData): Promise<User> => {
      try {
        const response = await api.post('/auth/register', data)
        return userSchema.parse(response.data)
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string): Promise<{ message: string; resetToken?: string; expiresAt?: string }> => {
      try {
        const response = await api.post('/auth/forgot-password', { email })
        return response.data
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload: { token: string; newPassword: string }): Promise<{ message: string }> => {
      try {
        const response = await api.post('/auth/reset-password', payload)
        return response.data
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { clearCart } = useCartStore()

  return useMutation({
    mutationFn: async () => {
      return Promise.resolve()
    },
    onSuccess: () => {
      logout()
      clearCart()
      queryClient.clear()
      navigate('/login')
    },
  })
}

export type UpdateProfileData = {
  name?: string
  avatarType?: 'emoji' | 'upload'
  avatarValue?: string
  backgroundColor?: string
  pronouns?: string
  shortBio?: string
  about?: string
  coverImage?: string
  showEmail?: boolean
  showFollowers?: boolean
  showFollowing?: boolean
  showFavorites?: boolean
  showLikedPosts?: boolean
  supportEnabled?: boolean
  supportUrl?: string
  supportQrImage?: string
}

export const useUploadAvatar = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await api.post('/users/upload-avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data;
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { updateUser, user: currentUser } = useAuthStore()

  return useMutation({
    mutationFn: async (data: UpdateProfileData): Promise<User> => {
      try {
        const response = await api.patch('/auth/profile', data)
        return userSchema.parse(response.data)
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    onSuccess: (updatedUser) => {
      const mergedUser = {
        ...updatedUser,
        staffRoles: currentUser?.staffRoles ?? [],
        primaryStaffRoleName: currentUser?.primaryStaffRoleName ?? null,
        primaryStaffRoleCode: currentUser?.primaryStaffRoleCode ?? null,
        staffTitle: currentUser?.staffTitle ?? null,
        staffDepartmentName: currentUser?.staffDepartmentName ?? null,
        staffDepartmentCode: currentUser?.staffDepartmentCode ?? null,
        staffProfileId: currentUser?.staffProfileId ?? null,
        staffEmployeeCode: currentUser?.staffEmployeeCode ?? null,
        isStaff: currentUser?.isStaff ?? false,
        staffStatus: currentUser?.staffStatus ?? null,
      }
      updateUser(mergedUser)
      queryClient.setQueryData(['user'], mergedUser)
    },
  })
}
