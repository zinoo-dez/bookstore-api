const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`
  return value
}

