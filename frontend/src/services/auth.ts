import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  LoginData, 
  RegisterData, 
  authResponseSchema, 
  userSchema,
  type AuthResponse,
  type User 
} from '@/lib/schemas'
import { useAuthStore } from '@/store/auth'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  sub: string
  email: string
  role: 'USER' | 'ADMIN'
  iat: number
  exp: number
}

export const useLogin = () => {
  const queryClient = useQueryClient()
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      const response = await api.post('/auth/login', data)
      return authResponseSchema.parse(response.data)
    },
    onSuccess: (data) => {
      try {
        const decoded = jwtDecode<JwtPayload>(data.access_token)
        const user: User = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.email.split('@')[0], // Fallback name
          role: decoded.role,
          createdAt: new Date().toISOString(),
        }
        login(user, data.access_token)
        queryClient.invalidateQueries({ queryKey: ['user'] })
      } catch (error) {
        console.error('Failed to decode JWT:', error)
        throw new Error('Invalid token received')
      }
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterData): Promise<User> => {
      const response = await api.post('/auth/register', data)
      return userSchema.parse(response.data)
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      // If you have a logout endpoint on the backend, call it here
      // await api.post('/auth/logout')
      return Promise.resolve()
    },
    onSuccess: () => {
      logout()
      queryClient.clear()
    },
  })
}