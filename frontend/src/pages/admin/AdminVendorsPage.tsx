import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Plus, Power, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import {
  useCreateVendor,
  useDeleteVendor,
  usePermanentDeleteVendor,
  useRestoreVendor,
  useUpdateVendor,
  useVendors,
  type Vendor,
} from '@/services/warehouses'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const AdminVendorsPage = () => {
  const user = useAuthStore((state) => state.user)
  const canManageVendors =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.vendor.manage')

  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddressInput, setShowAddressInput] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    contact: true,
    status: true,
    actions: true,
  })
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isEditingVendor, setIsEditingVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  })
  const { message, showMessage } = useTimedMessage(2600)
  const [form, setForm] = useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  })

  const { data: vendors = [], error } = useVendors(undefined, 'active')
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  const deleteVendor = useDeleteVendor()
  const restoreVendor = useRestoreVendor()
  const permanentDeleteVendor = usePermanentDeleteVendor()

  const filteredVendors = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return vendors.filter((vendor) => {
      const statusMatch =
        statusFilter === 'all'
        || (statusFilter === 'active' && vendor.isActive)
        || (statusFilter === 'inactive' && !vendor.isActive)
      const text = `${vendor.code} ${vendor.name} ${vendor.contactName || ''} ${vendor.email || ''} ${vendor.phone || ''}`.toLowerCase()
      const searchMatch = !keyword || text.includes(keyword)
      return statusMatch && searchMatch
    })
  }, [searchTerm, statusFilter, vendors])
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]
  const visibleColumnCount = columnOptions.filter((column) => visibleColumns[column.key]).length

  useEffect(() => {
    if (!selectedVendor) return
    setVendorForm({
      code: selectedVendor.code,
      name: selectedVendor.name,
      contactName: selectedVendor.contactName || '',
      email: selectedVendor.email || '',
      phone: selectedVendor.phone || '',
      address: selectedVendor.address || '',
      isActive: selectedVendor.isActive,
    })
    setIsEditingVendor(false)
  }, [selectedVendor])

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    if (!form.code || !form.name) {
      showMessage('Code and name are required.')
      return
    }

    try {
      await createVendor.mutateAsync({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        isActive: form.isActive,
      })
      setForm({
        code: '',
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        isActive: true,
      })
      setIsCreatePanelOpen(false)
      showMessage('Vendor created.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleSaveVendor = async () => {
    if (!selectedVendor) return
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    if (!vendorForm.code.trim() || !vendorForm.name.trim()) {
      showMessage('Code and name are required.')
      return
    }

    try {
      const updated = await updateVendor.mutateAsync({
        id: selectedVendor.id,
        data: {
          code: vendorForm.code.trim().toUpperCase(),
          name: vendorForm.name.trim(),
          contactName: vendorForm.contactName || undefined,
          email: vendorForm.email || undefined,
          phone: vendorForm.phone || undefined,
          address: vendorForm.address || undefined,
          isActive: vendorForm.isActive,
        },
      })
      setSelectedVendor(updated)
      setIsEditingVendor(false)
      showMessage('Vendor updated.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleToggleVendorStatus = async () => {
    if (!selectedVendor) return
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    try {
      const updated = await updateVendor.mutateAsync({
        id: selectedVendor.id,
        data: { isActive: !selectedVendor.isActive },
      })
      setSelectedVendor(updated)
      showMessage(updated.isActive ? 'Vendor activated.' : 'Vendor set to inactive.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    const confirmed = window.confirm(
      `Move vendor "${selectedVendor.name}" to bin? You can restore it later.`,
    )
    if (!confirmed) return

    try {
      await deleteVendor.mutateAsync(selectedVendor.id)
      setSelectedVendor(null)
      setIsEditingVendor(false)
      showMessage('Vendor moved to bin.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleRestoreVendor = async () => {
    if (!selectedVendor) return
    try {
      const restored = await restoreVendor.mutateAsync(selectedVendor.id)
      setSelectedVendor(restored)
      showMessage('Vendor restored from bin.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handlePermanentDeleteVendor = async () => {
    if (!selectedVendor) return
    const confirmed = window.confirm(
      `Permanently delete vendor "${selectedVendor.name}"? This cannot be undone.`,
    )
    if (!confirmed) return

    try {
      await permanentDeleteVendor.mutateAsync(selectedVendor.id)
      setSelectedVendor(null)
      setIsEditingVendor(false)
      showMessage('Vendor permanently deleted.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  return (
    <div className="surface-canvas min-h-screen space-y-6 p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Procurement</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Vendors</h1>
          <p className="mt-1 text-slate-500">Manage approved supplier sources for warehouse purchase orders.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatePanelOpen(true)}
          disabled={!canManageVendors}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" />
          Create Vendor
        </button>
        <Link
          to="/admin/bin"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label="Open bin"
        >
          <Trash2 className="h-4 w-4" />
        </Link>
      </div>

      {message && (
        <div className="surface-subtle px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          {message}
        </div>
      )}
      {error && (
        <div className="surface-subtle border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(error)}
        </div>
      )}

      <div className="surface-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Vendor Directory</h2>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Active Vendors
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, name, email, phone"
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <ColumnVisibilityMenu
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              options={columnOptions}
            />
          </div>
          <div className="admin-table-wrapper mt-4 overflow-auto">
            <table className="admin-table min-w-[940px] text-sm">
              <thead className="admin-table-head">
                <tr>
                  {visibleColumns.code && <th className="px-3 py-2 text-left">Code</th>}
                  {visibleColumns.name && <th className="px-3 py-2 text-left">Name</th>}
                  {visibleColumns.contact && <th className="px-3 py-2 text-left">Contact</th>}
                  {visibleColumns.status && <th className="px-3 py-2 text-left">Status</th>}
                  {visibleColumns.actions && <th className="px-3 py-2 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    {visibleColumns.code && <td className="px-3 py-2 font-semibold">{vendor.code}</td>}
                    {visibleColumns.name && (
                      <td className="px-3 py-2">
                        <p>{vendor.name}</p>
                        <p className="text-xs text-slate-500">{vendor.email || 'No email'}</p>
                      </td>
                    )}
                    {visibleColumns.contact && (
                      <td className="px-3 py-2">
                        <p>{vendor.contactName || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{vendor.phone || 'N/A'}</p>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${vendor.deletedAt ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : vendor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {vendor.deletedAt ? 'IN BIN' : vendor.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedVendor(vendor)
                          }}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumnCount} className="px-3 py-4 text-slate-500">No vendors found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      <AdminSlideOverPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="Vendors"
        title="Create Vendor"
        description="Add a new approved supplier source."
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-vendor-form"
              disabled={createVendor.isPending || !canManageVendors}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {createVendor.isPending ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        )}
      >
        <form
          id="create-vendor-form"
          onSubmit={submitCreate}
          className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45"
        >
          <input
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="Code"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Vendor name"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={form.contactName}
            onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
            placeholder="Contact name"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active vendor
          </label>
          <button
            type="button"
            onClick={() => setShowAddressInput((prev) => !prev)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {showAddressInput ? 'Hide Address' : 'Add Address'}
          </button>
          {showAddressInput && (
            <textarea
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Address"
              rows={3}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
          )}
        </form>
      </AdminSlideOverPanel>

      <AnimatePresence>
        {selectedVendor && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/25"
              onClick={() => setSelectedVendor(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed right-4 top-16 z-50 w-[min(560px,calc(100vw-2rem))] max-h-[82vh] overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:right-6"
              initial={{ opacity: 0, x: 36, scale: 0.99 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.99 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor Detail</p>
                  <h3 className="mt-1 text-xl font-bold">{selectedVendor.name}</h3>
                  <p className="text-xs text-slate-500">{selectedVendor.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVendor(null)}
                  className="rounded-full border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!isEditingVendor ? (
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="surface-subtle p-3">
                    <dt className="text-xs uppercase tracking-widest text-slate-500">Contact</dt>
                    <dd className="mt-1 font-medium">{selectedVendor.contactName || 'N/A'}</dd>
                  </div>
                  <div className="surface-subtle p-3">
                    <dt className="text-xs uppercase tracking-widest text-slate-500">Email</dt>
                    <dd className="mt-1">{selectedVendor.email || 'N/A'}</dd>
                  </div>
                  <div className="surface-subtle p-3">
                    <dt className="text-xs uppercase tracking-widest text-slate-500">Phone</dt>
                    <dd className="mt-1">{selectedVendor.phone || 'N/A'}</dd>
                  </div>
                  <div className="surface-subtle p-3">
                    <dt className="text-xs uppercase tracking-widest text-slate-500">Address</dt>
                    <dd className="mt-1">{selectedVendor.address || 'No address provided'}</dd>
                  </div>
                  <div className="surface-subtle p-3">
                    <dt className="text-xs uppercase tracking-widest text-slate-500">Status</dt>
                    <dd className="mt-1 font-semibold">{selectedVendor.deletedAt ? 'IN BIN' : selectedVendor.isActive ? 'ACTIVE' : 'INACTIVE'}</dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <label className="space-y-1 sm:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Code</span>
                    <input
                      value={vendorForm.code}
                      onChange={(e) => setVendorForm((prev) => ({ ...prev, code: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Name</span>
                    <input
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Contact</span>
                    <input
                      value={vendorForm.contactName}
                      onChange={(e) => setVendorForm((prev) => ({ ...prev, contactName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Email</span>
                    <input
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Phone</span>
                    <input
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Address</span>
                    <textarea
                      rows={2}
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={vendorForm.isActive}
                      onChange={(e) => setVendorForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Active vendor
                  </label>
                </div>
              )}

              {canManageVendors && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-4 dark:border-slate-800">
                  {!isEditingVendor ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditingVendor(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      {!selectedVendor.deletedAt ? (
                        <>
                          <button
                            type="button"
                            onClick={handleToggleVendorStatus}
                            disabled={updateVendor.isPending}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                          >
                            <Power className="h-3.5 w-3.5" />
                            {selectedVendor.isActive ? 'Set Inactive' : 'Set Active'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteVendor}
                            disabled={deleteVendor.isPending}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Move To Bin
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleRestoreVendor}
                            disabled={restoreVendor.isPending}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={handlePermanentDeleteVendor}
                            disabled={permanentDeleteVendor.isPending}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Permanently
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveVendor}
                        disabled={updateVendor.isPending}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
                      >
                        {updateVendor.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingVendor(false)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminVendorsPage
