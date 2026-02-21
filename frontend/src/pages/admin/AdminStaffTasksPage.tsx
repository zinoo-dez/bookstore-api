import { useMemo, useState } from 'react'
import { getErrorMessage } from '@/lib/api'
import {
  useCompleteTask,
  useCreateTask,
  useDepartments,
  useStaffProfiles,
  useTasks,
  type StaffTaskPriority,
  type StaffTaskStatus,
} from '@/services/staff'

const statusOptions: StaffTaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']
const priorityOptions: StaffTaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const AdminStaffTasksPage = () => {
  const [departmentId, setDepartmentId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [status, setStatus] = useState<StaffTaskStatus | ''>('')
  const [priority, setPriority] = useState<StaffTaskPriority | ''>('')
  const [taskType, setTaskType] = useState('')
  const [taskCategory, setTaskCategory] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [message, setMessage] = useState('')

  const { data: departments = [] } = useDepartments()
  const { data: staffProfiles = [] } = useStaffProfiles({ departmentId: departmentId || undefined })
  const { data: tasks = [] } = useTasks({
    departmentId: departmentId || undefined,
    staffId: staffId || undefined,
    status: status || undefined,
    priority: priority || undefined,
  })

  const createTask = useCreateTask()
  const completeTask = useCompleteTask()

  const filteredStaff = useMemo(
    () => staffProfiles.filter((profile) => !departmentId || profile.departmentId === departmentId),
    [departmentId, staffProfiles],
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

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2400)
  }

  const onCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId || !taskType || !priority) {
      showMessage('Select staff, task type, and priority.')
      return
    }

    try {
      await createTask.mutateAsync({
        staffId,
        type: taskType,
        priority,
        status: status || undefined,
        metadata: {
          category: taskCategory || undefined,
          deadline: taskDeadline || undefined,
        },
      })
      setTaskType('')
      setTaskCategory('')
      setTaskDeadline('')
      showMessage('Task created.')
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
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
        <h1 className="text-2xl font-bold">Tasks</h1>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}

      <form onSubmit={onCreateTask} className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Create Task</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-7">
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Select staff</option>
            {filteredStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.user.name}</option>
            ))}
          </select>
          <input value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="Task type" className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} placeholder="Category" className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as StaffTaskPriority | '')} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Priority</option>
            {priorityOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white dark:bg-amber-400 dark:text-slate-900">Add Task</button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select value={status} onChange={(e) => setStatus(e.target.value as StaffTaskStatus | '')} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Any status</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as StaffTaskPriority | '')} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">Any priority</option>
            {priorityOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </form>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Task Queue</h2>
        <div className="mt-4 overflow-auto rounded-xl border dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
