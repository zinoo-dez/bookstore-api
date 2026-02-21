import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InquiryListItem {
  id: string
  subject: string
  status: string
  priority: string
  type: string
  createdAt: string
  updatedAt: string
  department?: {
    id: string
    name: string
    code: string
  } | null
  assignedToStaff?: {
    id: string
    user?: {
      id: string
      name: string
      email: string
    } | null
  } | null
  _count?: {
    messages?: number
  }
}

export interface InquiryMessage {
  id: string
  inquiryId: string
  senderId: string
  senderType: 'USER' | 'STAFF'
  message: string
  createdAt: string
}

export interface InquiryAudit {
  id: string
  inquiryId: string
  action: 'CREATED' | 'ASSIGNED' | 'ESCALATED' | 'STATUS_CHANGED' | 'CLOSED'
  fromDepartmentId?: string | null
  toDepartmentId?: string | null
  performedByUserId: string
  createdAt: string
}

export interface InquiryInternalNote {
  id: string
  inquiryId: string
  note: string
  createdAt: string
}

export interface InquiryDetail extends InquiryListItem {
  messages?: InquiryMessage[]
  internalNotes?: InquiryInternalNote[]
  assignedToStaff?: {
    id: string
    userId?: string
    departmentId?: string
    user?: {
      id: string
      name: string
      email: string
    } | null
  } | null
}

export interface InquiriesListResponse {
  items: InquiryListItem[]
  total: number
  page: number
  limit: number
}

export interface InquiryOverviewResponse {
  totals: {
    total: number
    unresolved: number
    resolved: number
    unchecked: number
    inCharge: number
  }
  staffPerformance: Array<{
    staffProfileId: string
    staffName: string
    staffEmail: string
    solvedCount: number
    resolvedCount: number
    closedCount: number
    activeCount: number
    assignedTotal: number
  }>
}

export interface InquiriesQuery {
  status?: string
  type?: string
  priority?: string
  q?: string
  page?: number
  limit?: number
}

export interface InquiryQuickReplyTemplate {
  id: string
  title: string
  body: string
  type: string
  tags: string[]
}

export interface SaveInquiryQuickReplyTemplateInput {
  title: string
  body: string
  type?: string
  tags?: string[]
}

export const useInquiries = (query: InquiriesQuery = {}, enabled = true) =>
  useQuery({
    queryKey: ['inquiries', query],
    queryFn: async (): Promise<InquiriesListResponse> => {
      const response = await api.get('/inquiries', { params: query })
      return response.data
    },
    enabled,
  })

export const useInquiryQuickReplyTemplates = (type?: string, enabled = true) =>
  useQuery({
    queryKey: ['inquiries', 'templates', type || 'all'],
    queryFn: async (): Promise<InquiryQuickReplyTemplate[]> => {
      const response = await api.get('/inquiries/templates', {
        params: type ? { type } : undefined,
      })
      return response.data
    },
    enabled,
  })

export const useCreateInquiryQuickReplyTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveInquiryQuickReplyTemplateInput) => {
      const response = await api.post('/inquiries/templates', payload)
      return response.data as InquiryQuickReplyTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'templates'] })
    },
  })
}

export const useUpdateInquiryQuickReplyTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: string; data: SaveInquiryQuickReplyTemplateInput }) => {
      const response = await api.patch(`/inquiries/templates/${templateId}`, data)
      return response.data as InquiryQuickReplyTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'templates'] })
    },
  })
}

export const useDeleteInquiryQuickReplyTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post(`/inquiries/templates/${templateId}/delete`)
      return response.data as { success: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'templates'] })
    },
  })
}

export const useInquiry = (inquiryId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['inquiries', inquiryId],
    queryFn: async (): Promise<InquiryDetail> => {
      if (!inquiryId) {
        throw new Error('Inquiry id is required')
      }
      const response = await api.get(`/inquiries/${inquiryId}`)
      return response.data
    },
    enabled: Boolean(inquiryId) && enabled,
  })

export const useInquiryOverview = (days?: number, enabled = true) =>
  useQuery({
    queryKey: ['inquiries', 'overview', days ?? 'all'],
    queryFn: async (): Promise<InquiryOverviewResponse> => {
      const response = await api.get('/inquiries/overview', {
        params: typeof days === 'number' ? { days } : undefined,
      })
      return response.data
    },
    enabled,
  })

export const useInquiryAudit = (inquiryId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['inquiries', inquiryId, 'audit'],
    queryFn: async (): Promise<InquiryAudit[]> => {
      if (!inquiryId) {
        throw new Error('Inquiry id is required')
      }
      const response = await api.get(`/inquiries/${inquiryId}/audit`)
      return response.data
    },
    enabled: Boolean(inquiryId) && enabled,
  })

export const useAddInquiryMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ inquiryId, message }: { inquiryId: string; message: string }) => {
      const response = await api.post(`/inquiries/${inquiryId}/messages`, { message })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', vars.inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}

export const useAddInternalNote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ inquiryId, note }: { inquiryId: string; note: string }) => {
      const response = await api.post(`/inquiries/${inquiryId}/notes`, { note })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', vars.inquiryId] })
    },
  })
}

export const useUpdateInquiryStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ inquiryId, status }: { inquiryId: string; status: string }) => {
      const response = await api.patch(`/inquiries/${inquiryId}/status`, { status })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', vars.inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}

export const useAssignInquiry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ inquiryId, staffProfileId }: { inquiryId: string; staffProfileId: string }) => {
      const response = await api.post(`/inquiries/${inquiryId}/assign`, { staffProfileId })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', vars.inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', vars.inquiryId, 'audit'] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}

export const useEscalateInquiry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ inquiryId, toDepartmentId }: { inquiryId: string; toDepartmentId: string }) => {
      const response = await api.post(`/inquiries/${inquiryId}/escalate`, { toDepartmentId })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', vars.inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', vars.inquiryId, 'audit'] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}
