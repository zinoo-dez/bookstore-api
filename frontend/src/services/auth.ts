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