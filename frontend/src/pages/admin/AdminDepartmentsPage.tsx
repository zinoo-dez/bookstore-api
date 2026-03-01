import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '@/services/staff'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

const AdminDepartmentsPage = () => {
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const { message, showMessage } = useTimedMessage(2400)

  const { data: departments = [] } = useDepartments()
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code) {
      showMessage('Name and code are required.')
      return
    }

    try {
      await createDepartment.mutateAsync({ name, code, description, isActive: true })
      setName('')
      setCode('')
      setDescription('')
      setIsCreatePanelOpen(false)
      showMessage('Department created.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateDepartment.mutateAsync({ id, data: { isActive: !isActive } })
      showMessage('Department updated.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onDelete = async (id: string) => {
    try {
      await deleteDepartment.mutateAsync(id)
      showMessage('Department deleted.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
          <h1 className="text-2xl font-bold">Departments</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatePanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" />
          Create Department
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Department List</h2>
        <div className="admin-table-wrapper mt-4 overflow-auto">
          <table className="admin-table min-w-full text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Staff</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.id}>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{department.name}</p>
                    <p className="text-xs text-slate-500">{department.description || '-'}</p>
                  </td>
                  <td className="px-3 py-2">{department.code}</td>
                  <td className="px-3 py-2">{department._count?.staffProfiles || 0}</td>
                  <td className="px-3 py-2">{department.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleActive(department.id, department.isActive)}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(department.id)}
                        className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminSlideOverPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="Department"
        title="Create Department"
        description="Add a new department to organize staff and permissions."
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
              form="create-department-form"
              disabled={createDepartment.isPending}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {createDepartment.isPending ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        )}
      >
        <form
          id="create-department-form"
          onSubmit={onCreate}
          className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Department name"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </form>
      </AdminSlideOverPanel>
    </div>
  )
}

export default AdminDepartmentsPage
