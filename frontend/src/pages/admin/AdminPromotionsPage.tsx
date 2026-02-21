import { useMemo, useState } from 'react'
import { Edit2, Plus, Save, Trash2, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import {
  useCreatePromotion,
  useDeletePromotion,
  usePromotions,
  useUpdatePromotion,
  type PromotionCode,
  type PromotionDiscountType,
} from '@/services/promotions'

type PromotionForm = {
  code: string
  name: string
  description: string
  discountType: PromotionDiscountType
  discountValue: string
  minSubtotal: string
  maxDiscountAmount: string
  startsAt: string
  endsAt: string
  maxRedemptions: string
  isActive: boolean
}

const defaultForm: PromotionForm = {
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  minSubtotal: '0',
  maxDiscountAmount: '',
  startsAt: '',
  endsAt: '',
  maxRedemptions: '',
  isActive: true,
}

const asNumber = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

const AdminPromotionsPage = () => {
  const [activeOnly, setActiveOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<PromotionForm>(defaultForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const { data: promotions = [], isLoading, error } = usePromotions(activeOnly ? true : undefined)
  const createPromotion = useCreatePromotion()
  const updatePromotion = useUpdatePromotion()
  const deletePromotion = useDeletePromotion()

  const filteredPromotions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return promotions
    return promotions.filter((promo) => {
      return `${promo.code} ${promo.name} ${promo.description || ''}`.toLowerCase().includes(q)
    })
  }, [promotions, search])

  const setToast = (value: string) => {
    setMessage(value)
    window.setTimeout(() => setMessage(''), 2600)
  }

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
  }

  const loadPromotionToForm = (promo: PromotionCode) => {
    setEditingId(promo.id)
    setForm({
      code: promo.code,
      name: promo.name,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minSubtotal: String(promo.minSubtotal),
      maxDiscountAmount: promo.maxDiscountAmount ? String(promo.maxDiscountAmount) : '',
      startsAt: toDatetimeLocal(promo.startsAt),
      endsAt: toDatetimeLocal(promo.endsAt),
      maxRedemptions: promo.maxRedemptions ? String(promo.maxRedemptions) : '',
      isActive: promo.isActive,
    })
  }

  const buildPayload = () => {
    const discountValue = asNumber(form.discountValue)
    const minSubtotal = asNumber(form.minSubtotal)
    const maxDiscountAmount = form.maxDiscountAmount ? asNumber(form.maxDiscountAmount) : undefined
    const maxRedemptions = form.maxRedemptions ? asNumber(form.maxRedemptions) : undefined

    if (!form.code.trim() || !form.name.trim()) {
      throw new Error('Code and name are required.')
    }
    if (discountValue === null || discountValue <= 0) {
      throw new Error('Discount value must be greater than 0.')
    }
    if (minSubtotal === null || minSubtotal < 0) {
      throw new Error('Min subtotal must be 0 or more.')
    }
    if (maxDiscountAmount !== undefined && (maxDiscountAmount === null || maxDiscountAmount <= 0)) {
      throw new Error('Max discount must be greater than 0 when provided.')
    }
    if (maxRedemptions !== undefined && (maxRedemptions === null || maxRedemptions < 1)) {
      throw new Error('Max redemptions must be at least 1 when provided.')
    }

    return {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      minSubtotal,
      maxDiscountAmount,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      maxRedemptions: maxRedemptions ?? undefined,
      isActive: form.isActive,
    }
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const payload = buildPayload()
      if (editingId) {
        await updatePromotion.mutateAsync({ id: editingId, data: payload })
        setToast('Promotion updated.')
      } else {
        await createPromotion.mutateAsync(payload)
        setToast('Promotion created.')
      }
      resetForm()
    } catch (err) {
      setToast(getErrorMessage(err))
    }
  }

  const onDelete = async (promotion: PromotionCode) => {
    const confirmed = window.confirm(`Delete promotion ${promotion.code}?`)
    if (!confirmed) return

    try {
      await deletePromotion.mutateAsync(promotion.id)
      if (editingId === promotion.id) {
        resetForm()
      }
      setToast('Promotion deleted.')
    } catch (err) {
      setToast(getErrorMessage(err))
    }
  }

  return (
    <div className="surface-canvas min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="section-kicker">Revenue Controls</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Promotions</h1>
          <p className="mt-1 text-slate-500">Create and manage checkout promo codes for campaigns and loyalty offers.</p>
        </div>

        {message && <div className="surface-subtle px-4 py-3 text-sm font-medium">{message}</div>}
        {error && (
          <div className="surface-subtle border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {getErrorMessage(error)}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          <form onSubmit={onSubmit} className="surface-panel p-5 xl:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                {editingId ? 'Edit Promotion' : 'New Promotion'}
              </h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (BOOKLOVER10)" className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Promotion name" className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Description (optional)" className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />

              <div className="grid grid-cols-2 gap-3">
                <select value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as PromotionDiscountType }))} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <option value="PERCENT">Percent</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
                <input value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))} placeholder="Discount value" className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input value={form.minSubtotal} onChange={(e) => setForm((p) => ({ ...p, minSubtotal: e.target.value }))} placeholder="Min subtotal" className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
                <input value={form.maxDiscountAmount} onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} placeholder="Max discount" className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
                <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
              </div>

              <input value={form.maxRedemptions} onChange={(e) => setForm((p) => ({ ...p, maxRedemptions: e.target.value }))} placeholder="Max redemptions (optional)" className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Active promotion
              </label>
            </div>

            <button
              type="submit"
              disabled={createPromotion.isPending || updatePromotion.isPending}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
            >
              {editingId ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editingId ? 'Save Promotion' : 'Create Promotion'}
            </button>
          </form>

          <div className="surface-panel p-5 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Promotion Library</h2>
              <div className="flex items-center gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search code or name"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                />
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/70">
                  <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
                  Active only
                </label>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Offer</th>
                    <th className="py-2 pr-3">Window</th>
                    <th className="py-2 pr-3">Usage</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">Loading promotions...</td>
                    </tr>
                  )}
                  {!isLoading && filteredPromotions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">No promotions found.</td>
                    </tr>
                  )}
                  {filteredPromotions.map((promo) => {
                    const isUsedOut = promo.maxRedemptions !== null && promo.maxRedemptions !== undefined && promo.redeemedCount >= promo.maxRedemptions
                    return (
                      <tr key={promo.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                        <td className="py-3 pr-3">
                          <div className="font-semibold">{promo.code}</div>
                          <div className="text-xs text-slate-500">{promo.isActive ? 'Active' : 'Inactive'}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <div>{promo.name}</div>
                          <div className="text-xs text-slate-500">
                            {promo.discountType === 'PERCENT' ? `${promo.discountValue}%` : `$${promo.discountValue}`} off
                            {' · '}min ${promo.minSubtotal}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-slate-500">
                          <div>{promo.startsAt ? new Date(promo.startsAt).toLocaleDateString() : 'No start'}</div>
                          <div>{promo.endsAt ? new Date(promo.endsAt).toLocaleDateString() : 'No end'}</div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-slate-500">
                          <div>{promo.redeemedCount} redeemed</div>
                          <div>{promo.maxRedemptions ? `limit ${promo.maxRedemptions}` : 'no limit'}</div>
                          {isUsedOut && <div className="text-rose-600 dark:text-rose-300">Used up</div>}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button type="button" onClick={() => loadPromotionToForm(promo)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700">
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button type="button" onClick={() => onDelete(promo)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs text-rose-700 dark:border-rose-900/60 dark:text-rose-300">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPromotionsPage
