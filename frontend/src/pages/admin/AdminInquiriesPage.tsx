import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircleMore, Plus } from 'lucide-react'
import {
  useCreateInquiryQuickReplyTemplate,
  useDeleteInquiryQuickReplyTemplate,
  useInquiries,
  useInquiryOverview,
  useInquiryQuickReplyTemplates,
  useUpdateInquiryQuickReplyTemplate,
} from '@/services/inquiries'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

const TEMPLATE_TYPE_OPTIONS = ['COMMON', 'order', 'payment', 'legal', 'author', 'stock', 'other'] as const

const getWorkflowLabel = (item: {
  status?: string
  assignedToStaff?: {
    user?: {
      name?: string
    } | null
  } | null
}) => {
  const status = item.status?.toUpperCase() ?? 'OPEN'
  const assigneeName = item.assignedToStaff?.user?.name?.trim()

  if (status === 'RESOLVED' || status === 'CLOSED') {
    return {
      label: 'Solved',
      detail: assigneeName ? `by ${assigneeName}` : undefined,
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    }
  }

  if (!assigneeName && status === 'OPEN') {
    return {
      label: 'Unchecked',
      detail: 'No owner',
      tone: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200',
    }
  }

  if (assigneeName) {
    return {
      label: 'In charge',
      detail: assigneeName,
      tone: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200',
    }
  }

  return {
    label: status.split('_').join(' '),
    detail: undefined,
    tone: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200',
  }
}

const AdminInquiriesPage = () => {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(7)
  const [newTemplateTitle, setNewTemplateTitle] = useState('')
  const [newTemplateBody, setNewTemplateBody] = useState('')
  const [newTemplateType, setNewTemplateType] = useState<(typeof TEMPLATE_TYPE_OPTIONS)[number]>('COMMON')
  const [newTemplateTags, setNewTemplateTags] = useState('')
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingBody, setEditingBody] = useState('')
  const [editingType, setEditingType] = useState<(typeof TEMPLATE_TYPE_OPTIONS)[number]>('COMMON')
  const [editingTags, setEditingTags] = useState('')

  const { data, isLoading } = useInquiries({ page: 1, limit: 20 })
  const { data: overview, isLoading: isOverviewLoading } = useInquiryOverview(periodDays)
  const { data: templates = [], isLoading: isTemplatesLoading } = useInquiryQuickReplyTemplates()
  const createTemplate = useCreateInquiryQuickReplyTemplate()
  const updateTemplate = useUpdateInquiryQuickReplyTemplate()
  const deleteTemplate = useDeleteInquiryQuickReplyTemplate()
  const items = data?.items ?? []

  const totalLabel = useMemo(() => {
    if (!data) return '—'
    return `${data.total} inquiries`
  }, [data])

  const parseTags = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const handleCreateTemplate = async () => {
    const title = newTemplateTitle.trim()
    const body = newTemplateBody.trim()
    if (!title || !body) return

    await createTemplate.mutateAsync({
      title,
      body,
      type: newTemplateType,
      tags: parseTags(newTemplateTags),
    })

    setNewTemplateTitle('')
    setNewTemplateBody('')
    setNewTemplateType('COMMON')
    setNewTemplateTags('')
    setIsTemplatePanelOpen(false)
  }

  const startEditTemplate = (template: { id: string; title: string; body: string; type: string; tags: string[] }) => {
    setEditingTemplateId(template.id)
    setEditingTitle(template.title)
    setEditingBody(template.body)
    setEditingType((template.type as (typeof TEMPLATE_TYPE_OPTIONS)[number]) || 'COMMON')
    setEditingTags((template.tags ?? []).join(', '))
  }

  const cancelEditTemplate = () => {
    setEditingTemplateId(null)
    setEditingTitle('')
    setEditingBody('')
    setEditingType('COMMON')
    setEditingTags('')
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplateId) return
    const title = editingTitle.trim()
    const body = editingBody.trim()
    if (!title || !body) return

    await updateTemplate.mutateAsync({
      templateId: editingTemplateId,
      data: {
        title,
        body,
        type: editingType,
        tags: parseTags(editingTags),
      },
    })

    cancelEditTemplate()
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Customer Service
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Inquiries Review
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {totalLabel}
            </p>
          </div>
          <Link
            to="/cs"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
          >
            <MessageCircleMore className="h-4 w-4" />
            Open CS Portal
          </Link>
        </div>
      </section>

      <section className="surface-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Operational summary
          </p>
          <select
            value={periodDays}
            onChange={(event) => setPeriodDays(Number(event.target.value) as 7 | 30 | 90)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        {isOverviewLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Loading inquiry overview...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Unresolved</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{overview?.totals.unresolved ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Unchecked</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{overview?.totals.unchecked ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">In charge</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{overview?.totals.inCharge ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Solved</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{overview?.totals.resolved ?? 0}</p>
            </div>
          </div>
        )}
      </section>

      <section className="surface-panel p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Staff solve performance</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ranked by solved inquiries (resolved + closed).
          </p>
        </div>
        {!overview || overview.staffPerformance.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No performance records yet.
          </div>
        ) : (
          <div className="space-y-3">
            {overview.staffPerformance.map((staff) => (
              <div
                key={staff.staffProfileId}
                className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{staff.staffName}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{staff.staffEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{staff.solvedCount} solved</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {staff.activeCount} active • {staff.assignedTotal} total assigned
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface-panel p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick reply templates</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Shared templates used by customer service in inquiry replies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTemplatePanelOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {isTemplatesLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No shared templates yet.
            </div>
          ) : (
            templates.map((template) => {
              const isEditing = editingTemplateId === template.id
              return (
                <div
                  key={template.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <select
                          value={editingType}
                          onChange={(event) => setEditingType(event.target.value as (typeof TEMPLATE_TYPE_OPTIONS)[number])}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                          {TEMPLATE_TYPE_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                              {item.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <input
                          value={editingTags}
                          onChange={(event) => setEditingTags(event.target.value)}
                          placeholder="Tags (comma separated)"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:col-span-2"
                        />
                        <textarea
                          value={editingBody}
                          onChange={(event) => setEditingBody(event.target.value)}
                          rows={4}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:col-span-2"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEditTemplate}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:border-slate-600 dark:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateTemplate}
                          disabled={updateTemplate.isPending || !editingTitle.trim() || !editingBody.trim()}
                          className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-200"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{template.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {(template.type || 'COMMON').toUpperCase()} • {(template.tags ?? []).join(', ') || 'No tags'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditTemplate(template)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-600 dark:text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTemplate.mutate(template.id)}
                            disabled={deleteTemplate.isPending}
                            className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-400/40 dark:text-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{template.body}</p>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      <AdminSlideOverPanel
        open={isTemplatePanelOpen}
        onClose={() => setIsTemplatePanelOpen(false)}
        kicker="Templates"
        title="Create Template"
        description="Add a reusable quick reply template for customer-service inquiry responses."
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTemplatePanelOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleCreateTemplate()}
              disabled={createTemplate.isPending || !newTemplateTitle.trim() || !newTemplateBody.trim()}
              className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900"
            >
              {createTemplate.isPending ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        )}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={newTemplateTitle}
            onChange={(event) => setNewTemplateTitle(event.target.value)}
            placeholder="Template title"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <select
            value={newTemplateType}
            onChange={(event) => setNewTemplateType(event.target.value as (typeof TEMPLATE_TYPE_OPTIONS)[number])}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {TEMPLATE_TYPE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
          <input
            value={newTemplateTags}
            onChange={(event) => setNewTemplateTags(event.target.value)}
            placeholder="Tags (comma separated)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:col-span-2"
          />
          <textarea
            value={newTemplateBody}
            onChange={(event) => setNewTemplateBody(event.target.value)}
            rows={6}
            placeholder="Template message body..."
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:col-span-2"
          />
        </div>
      </AdminSlideOverPanel>

      <section className="surface-panel p-6">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Loading inquiries...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No inquiries yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const workflow = getWorkflowLabel(item)
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.subject || 'Inquiry'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.type?.toUpperCase()} • {item.priority?.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.department?.name ?? 'Unassigned'}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${workflow.tone}`}>
                      {workflow.label}
                    </span>
                    {workflow.detail && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{workflow.detail}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Messages: {item._count?.messages ?? 0}</span>
                    <span>Updated: {new Date(item.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminInquiriesPage
