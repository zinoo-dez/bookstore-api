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

interface JwtPayload {
  sub: string
  email: string
  role: 'USER' | 'ADMIN'
  avatarType?: 'emoji' | 'upload'
  avatarValue?: string
  backgroundColor?: string
  iat: number
  exp: number
}

export const useLogin = () => {
  const queryClient = useQueryClient()
  const { login } = useAuthStore()
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
          name: decoded.email.split('@')[0],
          role: decoded.role,
          avatarType: decoded.avatarType || 'emoji',
          avatarValue: decoded.avatarValue,
          backgroundColor: decoded.backgroundColor,
          createdAt: new Date().toISOString(),
        }
        login(user, data.access_token)
        queryClient.invalidateQueries({ queryKey: ['user'] })

        // Redirect admin to dashboard, regular users to home
        if (decoded.role === 'ADMIN') {
          navigate('/admin')
        } else {
          navigate('/')
        }
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
  const { updateUser } = useAuthStore()

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
      updateUser(updatedUser)
      queryClient.setQueryData(['user'], updatedUser)
    },
  })
}