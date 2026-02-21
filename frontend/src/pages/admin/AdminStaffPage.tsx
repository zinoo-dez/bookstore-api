import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getErrorMessage } from '@/lib/api'
import { useHasPermission } from '@/lib/permissions'
import {
  useAssignRole,
  useCreateStaffAccount,
  useDepartments,
  useHireExistingUser,
  useRoles,
  useStaffAuditLogs,
  useStaffCandidates,
  useStaffProfiles,
  useUpdateStaffProfile,
  type StaffStatus,
} from '@/services/staff'
import { BarChart3, Pencil, ListTodo } from 'lucide-react'

const statusOptions: StaffStatus[] = ['ACTIVE', 'ON_LEAVE', 'INACTIVE']

const AdminStaffPage = () => {
  const navigate = useNavigate()
  const canCreateStaff = useHasPermission('hr.staff.create')
  const canEditStaff = useHasPermission('hr.staff.update')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState<StaffStatus | ''>('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [search, setSearch] = useState('')
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing')
  const [candidateSearch, setCandidateSearch] = useState('')

  const [existingHireForm, setExistingHireForm] = useState({
    userId: '',
    departmentId: '',
    employeeCode: '',
    title: '',
  })
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    email: '',
    departmentId: '',
    employeeCode: '',
    title: '',
    sendActivationEmail: false,
    convertExisting: false,
  })

  const [assignRoleId, setAssignRoleId] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    employeeCode: '',
    departmentId: '',
    status: 'ACTIVE' as StaffStatus,
  })
  const [message, setMessage] = useState('')

  const { data: departments = [] } = useDepartments()
  const { data: roles = [] } = useRoles()
  const { data: staffProfiles = [], error: staffProfilesError } = useStaffProfiles({
    departmentId: departmentId || undefined,
    roleId: roleId || undefined,
    status: status || undefined,
  })

  const { data: users = [] } = useStaffCandidates(candidateSearch, { enabled: canCreateStaff && createMode === 'existing' })

  const hireExistingUser = useHireExistingUser()
  const createStaffAccount = useCreateStaffAccount()
  const updateStaffProfile = useUpdateStaffProfile()
  const assignRole = useAssignRole()
  const { data: auditLogs = [] } = useStaffAuditLogs(selectedStaffId || undefined)
  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase()

    return staffProfiles.filter((profile) => {
      if (departmentId && profile.departmentId !== departmentId) {
        return false
      }

      if (status && profile.status !== status) {
        return false
      }

      if (roleId && !profile.assignments.some((assignment) => assignment.roleId === roleId)) {
        return false
      }

      if (!query) {
        return true
      }

      return (
        profile.user.name.toLowerCase().includes(query) ||
        profile.user.email.toLowerCase().includes(query)
      )
    })
  }, [search, staffProfiles, departmentId, roleId, status])

  const selectedStaff = staffProfiles.find((profile) => profile.id === selectedStaffId)

  useEffect(() => {
    if (!selectedStaff) return
    setEditForm({
      title: selectedStaff.title || '',
      employeeCode: selectedStaff.employeeCode || '',
      departmentId: selectedStaff.departmentId || '',
      status: selectedStaff.status || 'ACTIVE',
    })
  }, [selectedStaff])

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2400)
  }

  const openEditModal = (staffId: string) => {
    setSelectedStaffId(staffId)
    setIsEditModalOpen(true)
  }

  const handleHireExistingUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!existingHireForm.userId || !existingHireForm.departmentId || !existingHireForm.title) {
      showMessage('User, department, and title are required.')
      return
    }

    try {
      await hireExistingUser.mutateAsync({
        userId: existingHireForm.userId,
        departmentId: existingHireForm.departmentId,
        employeeCode: existingHireForm.employeeCode || undefined,
        title: existingHireForm.title,
      })
      setExistingHireForm({ userId: '', departmentId: '', employeeCode: '', title: '' })
      showMessage('Existing user hired successfully.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleCreateStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newAccountForm.name || !newAccountForm.email || !newAccountForm.departmentId || !newAccountForm.title) {
      showMessage('Name, email, department, and title are required.')
      return
    }

    try {
      const result = await createStaffAccount.mutateAsync({
        name: newAccountForm.name,
        email: newAccountForm.email,
        departmentId: newAccountForm.departmentId,
        employeeCode: newAccountForm.employeeCode || undefined,
        title: newAccountForm.title,
        sendActivationEmail: newAccountForm.sendActivationEmail,
        convertExisting: newAccountForm.convertExisting,
      })
      setNewAccountForm({
        name: '',
        email: '',
        departmentId: '',
        employeeCode: '',
        title: '',
        sendActivationEmail: false,
        convertExisting: false,
      })
      showMessage(
        result?.mode === 'CONVERTED_EXISTING_USER'
          ? 'Existing user converted to staff.'
          : 'New staff account created.',
      )
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as {
          message?: { code?: string; existingUser?: { id: string; email: string } } | string
        } | undefined
        const structured = typeof errorData?.message === 'object' ? errorData?.message : undefined
        if (structured?.code === 'EXISTING_USER_FOUND') {
          setNewAccountForm((prev) => ({ ...prev, convertExisting: true }))
          showMessage('User email already exists. Submit again to convert that existing user into staff.')
          return
        }
      }
      showMessage(getErrorMessage(error))
    }
  }

  const handleAssignRole = async () => {
    if (!selectedStaffId || !assignRoleId) {
      showMessage('Choose a staff member and role first.')
      return
    }

    try {
      await assignRole.mutateAsync({ staffId: selectedStaffId, roleId: assignRoleId })
      setAssignRoleId('')
      showMessage('Role assigned.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleUpdateSelectedStaff = async () => {
    if (!selectedStaffId) {
      showMessage('Select a staff row first.')
      return
    }

    if (!editForm.title || !editForm.departmentId || !editForm.employeeCode) {
      showMessage('Title, department, and employee code are required.')
      return
    }

    try {
      await updateStaffProfile.mutateAsync({
        id: selectedStaffId,
        data: {
          title: editForm.title,
          employeeCode: editForm.employeeCode,
          departmentId: editForm.departmentId,
          status: editForm.status,
        },
      })
      showMessage('Staff profile updated.')
      setIsEditModalOpen(false)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
        <h1 className="text-2xl font-bold">Admin Staff Directory</h1>
        <p className="mt-1 text-slate-500">Create staff profiles, filter by department/role/status, and assign roles.</p>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}
      {staffProfilesError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(staffProfilesError)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">New Staff</h2>
          <p className="mt-1 text-xs text-slate-500">Create a new staff member or hire an existing user.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border p-1 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCreateMode('existing')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${createMode === 'existing' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Hire Existing
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('new')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${createMode === 'new' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Create Account
            </button>
          </div>

          {createMode === 'existing' ? (
            <form onSubmit={handleHireExistingUser} className="mt-4 space-y-3">
              <input
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search user by name/email"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <select
                value={existingHireForm.userId}
                onChange={(e) => setExistingHireForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <select
                value={existingHireForm.departmentId}
                onChange={(e) => setExistingHireForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <input
                value={existingHireForm.employeeCode}
                onChange={(e) => setExistingHireForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                placeholder="Employee code (optional)"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={existingHireForm.title}
                onChange={(e) => setExistingHireForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="submit"
                disabled={hireExistingUser.isPending}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
              >
                {hireExistingUser.isPending ? 'Hiring...' : 'Hire Existing User'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateStaffAccount} className="mt-4 space-y-3">
              <input
                value={newAccountForm.name}
                onChange={(e) => setNewAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={newAccountForm.email}
                onChange={(e) => setNewAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <select
                value={newAccountForm.departmentId}
                onChange={(e) => setNewAccountForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <input
                value={newAccountForm.employeeCode}
                onChange={(e) => setNewAccountForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                placeholder="Employee code (optional)"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={newAccountForm.title}
                onChange={(e) => setNewAccountForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={newAccountForm.sendActivationEmail}
                  onChange={(e) => setNewAccountForm((prev) => ({ ...prev, sendActivationEmail: e.target.checked }))}
                />
                Send account activation email (placeholder)
              </label>
              {newAccountForm.convertExisting && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Existing email detected. Submitting now will convert that user into staff.
                </p>
              )}
              <button
                type="submit"
                disabled={createStaffAccount.isPending}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
              >
                {createStaffAccount.isPending ? 'Creating...' : 'Create Staff Account'}
              </button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Filters</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  [{role.code || 'NO_CODE'}] {role.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StaffStatus | '')}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 overflow-auto rounded-xl border dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-3 py-2 text-left">Staff</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Roles</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 ${selectedStaffId === profile.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                    onClick={() => setSelectedStaffId(profile.id)}
                  >
                    <td className="px-3 py-2">
                      <p className="font-semibold">{profile.user.name}</p>
                      <p className="text-xs text-slate-500">{profile.user.email}</p>
                    </td>
                    <td className="px-3 py-2">{profile.department.name}</td>
                    <td className="px-3 py-2">{profile.title}</td>
                    <td className="px-3 py-2">{profile.status}</td>
                    <td className="px-3 py-2">
                      {profile.assignments.map((assignment) => `[${assignment.role.code || 'NO_CODE'}] ${assignment.role.name}`).join(', ') || 'None'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!canEditStaff) {
                              showMessage('You do not have permission to edit staff profiles.')
                              return
                            }
                            openEditModal(profile.id)
                          }}
                          className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                          title="Edit profile"
                          disabled={!canEditStaff}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/admin/staff/performance')
                          }}
                          className="rounded border px-2 py-1 text-xs"
                          title="View performance"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/admin/staff/tasks')
                          }}
                          className="rounded border px-2 py-1 text-xs"
                          title="View tasks"
                        >
                          <ListTodo className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>No staff found for your filters.</td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Edit Staff Profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedStaff ? `Selected: ${selectedStaff.user.name}` : 'Select a staff row to edit'}
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Title"
              disabled={!selectedStaffId}
              className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              value={editForm.employeeCode}
              onChange={(e) => setEditForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
              placeholder="Employee code"
              disabled={!selectedStaffId}
              className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
            />
            <select
              value={editForm.departmentId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}
              disabled={!selectedStaffId}
              className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as StaffStatus }))}
              disabled={!selectedStaffId}
              className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleUpdateSelectedStaff}
              disabled={!selectedStaffId || updateStaffProfile.isPending}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
            >
              {updateStaffProfile.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-slate-500">Assign Role</h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              value={assignRoleId}
              onChange={(e) => setAssignRoleId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Choose role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  [{role.code || 'NO_CODE'}] {role.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssignRole}
              disabled={!selectedStaffId || !assignRoleId || assignRole.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
            >
              {assignRole.isPending ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Audit Trail</h2>
          <div className="mt-4 max-h-64 space-y-2 overflow-auto">
            {auditLogs.length === 0 && <p className="text-sm text-slate-500">No audit entries for this staff member.</p>}
            {auditLogs.map((log: { id: string; action: string; resource: string; createdAt: string; actor?: { name?: string } }) => (
              <div key={log.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                <p className="font-semibold">{log.action}</p>
                <p className="text-xs text-slate-500">
                  {log.resource} • {log.actor?.name || 'System'} • {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Edit Staff</p>
                <h3 className="mt-1 text-lg font-semibold">{selectedStaff.user.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-md border px-2 py-1 text-xs dark:border-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={editForm.employeeCode}
                onChange={(e) => setEditForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                placeholder="Employee code"
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <select
                value={editForm.departmentId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as StaffStatus }))}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-widest dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSelectedStaff}
                disabled={updateStaffProfile.isPending}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900"
              >
                {updateStaffProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStaffPage
