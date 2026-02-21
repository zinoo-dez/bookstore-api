import { useState } from 'react'
import { getErrorMessage } from '@/lib/api'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '@/services/staff'

const AdminDepartmentsPage = () => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')

  const { data: departments = [] } = useDepartments()
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2400)
  }

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
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
        <h1 className="text-2xl font-bold">Departments</h1>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}

      <form onSubmit={onCreate} className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Add Department</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Department name"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white dark:bg-amber-400 dark:text-slate-900"
        >
          Create
        </button>
      </form>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Department List</h2>
        <div className="mt-4 overflow-auto rounded-xl border dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Staff</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
    </div>
  )
}

export default AdminDepartmentsPage
