import { useMemo, useState } from 'react'
import { getErrorMessage } from '@/lib/api'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import {
  useCompleteTask,
  useCreateTask,
  useDepartments,
  useStaffProfiles,
  useTasks,
  type StaffTaskPriority,
  type StaffTaskStatus,
} from '@/services/staff'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const statusOptions: StaffTaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']
const priorityOptions: StaffTaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const AdminStaffTasksPage = () => {
  const [filterDepartmentId, setFilterDepartmentId] = useState('')
  const [filterStaffId, setFilterStaffId] = useState('')
  const [filterStatus, setFilterStatus] = useState<StaffTaskStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<StaffTaskPriority | ''>('')
  const [createDepartmentId, setCreateDepartmentId] = useState('')
  const [createStaffId, setCreateStaffId] = useState('')
  const [createPriority, setCreatePriority] = useState<StaffTaskPriority | ''>('')
  const [taskType, setTaskType] = useState('')
  const [taskCategory, setTaskCategory] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const { message, showMessage } = useTimedMessage(2400)

  const { data: departments = [] } = useDepartments()
  const { data: staffProfiles = [] } = useStaffProfiles()
  const { data: tasks = [] } = useTasks({
    departmentId: filterDepartmentId || undefined,
    staffId: filterStaffId || undefined,
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
  })

  const createTask = useCreateTask()
  const completeTask = useCompleteTask()

  const filteredFilterStaff = useMemo(
    () => staffProfiles.filter((profile) => !filterDepartmentId || profile.departmentId === filterDepartmentId),
    [filterDepartmentId, staffProfiles],
  )
  const filteredCreateStaff = useMemo(
    () => staffProfiles.filter((profile) => !createDepartmentId || profile.departmentId === createDepartmentId),
    [createDepartmentId, staffProfiles],
  )

  const staffCompletionRate = useMemo(() => {
    const result = new Map<string, { done: number; total: number }>()
    tasks.forEach((task) => {
      const bucket = result.get(task.staffId) ?? { done: 0, total: 0 }
      bucket.total += 1
      if (task.status === 'COMPLETED') bucket.done += 1
      result.set(task.staffId, bucket)
    })
    return result
  }, [tasks])

  const onCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createStaffId || !taskType || !createPriority) {
      showMessage('Select staff, task type, and priority.')
      return
    }

    try {
      await createTask.mutateAsync({
        staffId: createStaffId,
        type: taskType,
        priority: createPriority,
        metadata: {
          category: taskCategory || undefined,
          deadline: taskDeadline || undefined,
        },
      })
      setCreateStaffId('')
      setCreatePriority('')
      setCreateDepartmentId('')
      setTaskType('')
      setTaskCategory('')
      setTaskDeadline('')
      showMessage('Task created.')
      setIsCreatePanelOpen(false)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onCompleteTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId)
      showMessage('Task completed.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatePanelOpen(true)}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          Add Task
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Queue Filters</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <select value={filterDepartmentId} onChange={(e) => setFilterDepartmentId(e.target.value)} className="h-12 rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          <select value={filterStaffId} onChange={(e) => setFilterStaffId(e.target.value)} className="h-12 rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">All staff</option>
            {filteredFilterStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.user.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StaffTaskStatus | '')} className="h-12 rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Any status</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as StaffTaskPriority | '')} className="h-12 rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Any priority</option>
            {priorityOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      <AdminSlideOverPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        title="Create Task"
        description="Assign a new task to a staff member."
        widthClassName="sm:max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-task-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              Add Task
            </button>
          </div>
        }
      >
        <form id="create-task-form" onSubmit={onCreateTask} className="space-y-3">
          <select value={createDepartmentId} onChange={(e) => setCreateDepartmentId(e.target.value)} className="h-12 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          <select value={createStaffId} onChange={(e) => setCreateStaffId(e.target.value)} className="h-12 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Select staff</option>
            {filteredCreateStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.user.name}</option>
            ))}
          </select>
          <input value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="Task type" className="h-12 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} placeholder="Category" className="h-12 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} className="h-12 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <select value={createPriority} onChange={(e) => setCreatePriority(e.target.value as StaffTaskPriority | '')} className="h-12 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Priority</option>
            {priorityOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </form>
      </AdminSlideOverPanel>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Task Queue</h2>
        <div className="admin-table-wrapper mt-4 overflow-auto">
          <table className="admin-table min-w-full text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Staff</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Deadline</th>
                <th className="px-3 py-2 text-left">Priority</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Staff Rate</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const meta = (task.metadata || {}) as { category?: string; deadline?: string }
                const rate = staffCompletionRate.get(task.staffId)
                const completionPct = rate && rate.total > 0 ? Math.round((rate.done / rate.total) * 100) : 0
                return (
                  <tr key={task.id}>
                    <td className="px-3 py-2">{task.staff.user.name}</td>
                    <td className="px-3 py-2">{task.staff.department.name}</td>
                    <td className="px-3 py-2">{task.type}</td>
                    <td className="px-3 py-2">{meta.category || '-'}</td>
                    <td className="px-3 py-2">{meta.deadline ? new Date(meta.deadline).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">{task.priority}</td>
                    <td className="px-3 py-2">{task.status}</td>
                    <td className="px-3 py-2">{completionPct}%</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onCompleteTask(task.id)}
                        disabled={task.status === 'COMPLETED'}
                        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminStaffTasksPage
