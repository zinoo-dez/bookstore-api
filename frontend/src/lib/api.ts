import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

// Helper to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string | string[] }>
    
    // Handle validation errors (array of messages)
    if (Array.isArray(axiosError.response?.data?.message)) {
      return axiosError.response.data.message.join(', ')
    }
    
    // Handle single error message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    
    // Handle network errors
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Cannot connect to server. Please check if the backend is running.'
    }
    
    // Handle timeout
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.'
    }
    
    // Generic axios error
    return axiosError.message || 'An error occurred'
  }
  
  // Generic error
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}
