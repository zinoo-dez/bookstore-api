import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isStaff?: boolean
  staffStatus?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | null
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
  avatar?: string
  avatarType?: 'emoji' | 'upload'
  avatarValue?: string | null
  backgroundColor?: string | null
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
  createdAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  portalMode: 'buyer' | 'staff' | null
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
  setPortalMode: (mode: 'buyer' | 'staff' | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      portalMode: null,
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          portalMode: null,
        }),
      updateUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),
      setPortalMode: (mode) =>
        set((state) => ({
          ...state,
          portalMode: mode,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
