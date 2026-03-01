import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getErrorMessage } from '@/lib/api'
import { useHasPermission } from '@/lib/permissions'
import {
  useCreateStaffAccount,
  useDepartments,
  useElevatedAccounts,
  useHireExistingUser,
  useRoles,
  useStaffCandidates,
  useStaffProfiles,
  useUpdateStaffAccountAccess,
  useUpdateStaffProfile,
  type StaffStatus,
} from '@/services/staff'
import { BarChart3, Pencil, ListTodo, Plus } from 'lucide-react'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import { useAuthStore } from '@/store/auth.store'

const statusOptions: StaffStatus[] = ['ACTIVE', 'ON_LEAVE', 'INACTIVE']

const AdminStaffPage = () => {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const canCreateStaff = useHasPermission('hr.staff.create')
  const canEditStaff = useHasPermission('hr.staff.update')
  const canEditAccountAccess = currentUser?.role === 'SUPER_ADMIN'
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState<StaffStatus | ''>('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [search, setSearch] = useState('')
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState({
    staff: true,
    access: true,
    department: true,
    title: true,
    status: true,
    roles: true,
    actions: true,
  })

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

  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    employeeCode: '',
    departmentId: '',
    status: 'ACTIVE' as StaffStatus,
    accountRole: 'USER' as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
  })
  const { message, showMessage } = useTimedMessage(2400)

  const { data: departments = [] } = useDepartments()
  const { data: roles = [] } = useRoles()
  const { data: elevatedAccounts = [] } = useElevatedAccounts()
  const { data: staffProfiles = [], error: staffProfilesError } = useStaffProfiles({
    departmentId: departmentId || undefined,
    roleId: roleId || undefined,
    status: status || undefined,
  })

  const { data: users = [] } = useStaffCandidates(candidateSearch, { enabled: canCreateStaff && createMode === 'existing' })

  const hireExistingUser = useHireExistingUser()
  const createStaffAccount = useCreateStaffAccount()
  const updateStaffProfile = useUpdateStaffProfile()
  const updateStaffAccountAccess = useUpdateStaffAccountAccess()
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
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
    { key: 'staff', label: 'Staff' },
    { key: 'access', label: 'Account Access' },
    { key: 'department', label: 'Department' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'roles', label: 'Roles' },
    { key: 'actions', label: 'Actions' },
  ]
  const visibleColumnCount = columnOptions.filter((column) => visibleColumns[column.key]).length

  useEffect(() => {
    if (!selectedStaff) return
    setEditForm({
      title: selectedStaff.title || '',
      employeeCode: selectedStaff.employeeCode || '',
      departmentId: selectedStaff.departmentId || '',
      status: selectedStaff.status || 'ACTIVE',
      accountRole: selectedStaff.user.role,
    })
  }, [selectedStaff])

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
      setCandidateSearch('')
      setIsCreatePanelOpen(false)
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
      setIsCreatePanelOpen(false)
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

      if (
        canEditAccountAccess &&
        selectedStaff?.user.role &&
        selectedStaff.user.role !== editForm.accountRole
      ) {
        await updateStaffAccountAccess.mutateAsync({
          id: selectedStaffId,
          role: editForm.accountRole,
        })
      }

      showMessage('Staff profile updated.')
      setIsEditModalOpen(false)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
          <h1 className="text-2xl font-bold">Admin Staff Directory</h1>
          <p className="mt-1 text-slate-500">Filter by department/role/status and manage staff profiles.</p>
        </div>
        {canCreateStaff && (
          <button
            type="button"
            onClick={() => setIsCreatePanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        )}
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

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
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
            <ColumnVisibilityMenu
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              options={columnOptions}
            />
          </div>

          <div className="admin-table-wrapper mt-4 overflow-auto">
            <table className="admin-table min-w-[1080px] text-sm">
              <thead className="admin-table-head">
              <tr>
                {visibleColumns.staff && <th className="px-3 py-2 text-left">Staff</th>}
                {visibleColumns.access && <th className="px-3 py-2 text-left">Account Access</th>}
                {visibleColumns.department && <th className="px-3 py-2 text-left">Department</th>}
                {visibleColumns.title && <th className="px-3 py-2 text-left">Title</th>}
                {visibleColumns.status && <th className="px-3 py-2 text-left">Status</th>}
                {visibleColumns.roles && <th className="px-3 py-2 text-left">Roles</th>}
                {visibleColumns.actions && <th className="px-3 py-2 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
                {filteredProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 ${selectedStaffId === profile.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                    onClick={() => setSelectedStaffId(profile.id)}
                  >
                    {visibleColumns.staff && (
                      <td className="px-3 py-2">
                        <p className="font-semibold">{profile.user.name}</p>
                        <p className="text-xs text-slate-500">{profile.user.email}</p>
                      </td>
                    )}
                    {visibleColumns.access && (
                      <td className="px-3 py-2">
                        {(() => {
                          const accountAccessLabel =
                            profile.user.role === 'USER' ? 'STAFF' : profile.user.role

                          return (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            profile.user.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
                              : profile.user.role === 'ADMIN'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-200'
                          }`}
                        >
                              {accountAccessLabel}
                        </span>
                          )
                        })()}
                      </td>
                    )}
                    {visibleColumns.department && <td className="px-3 py-2">{profile.department.name}</td>}
                    {visibleColumns.title && <td className="px-3 py-2">{profile.title}</td>}
                    {visibleColumns.status && <td className="px-3 py-2">{profile.status}</td>}
                    {visibleColumns.roles && (
                      <td className="px-3 py-2">
                        {profile.assignments.map((assignment) => `[${assignment.role.code || 'NO_CODE'}] ${assignment.role.name}`).join(', ') || 'None'}
                      </td>
                    )}
                    {visibleColumns.actions && (
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
                            className="rounded border border-slate-300 px-2 py-1 text-xs transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
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
                            className="rounded border border-slate-300 px-2 py-1 text-xs transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
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
                            className="rounded border border-slate-300 px-2 py-1 text-xs transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                            title="View tasks"
                          >
                            <ListTodo className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-500" colSpan={visibleColumnCount}>No staff found for your filters.</td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Admin & Super Admin Accounts
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Platform-level access accounts shown here, with staff profile linkage.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {elevatedAccounts.length} accounts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[860px] text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Account Access</th>
                <th className="px-3 py-2 text-left">Staff Profile</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {elevatedAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-3 py-2 font-medium">{account.name}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{account.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        account.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                      }`}
                    >
                      {account.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {account.staffProfile
                      ? `${account.staffProfile.department.name} • ${account.staffProfile.title}`
                      : 'Not linked'}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {elevatedAccounts.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={5}>
                    No admin or super admin accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminSlideOverPanel
        open={Boolean(isCreatePanelOpen && canCreateStaff)}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="New Staff"
        title="Add Team Member"
        description="Create a new staff member or hire an existing user."
      >
        <div className="mt-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateMode('existing')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${createMode === 'existing' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-700/60'}`}
                  >
                    Hire Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('new')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${createMode === 'new' ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900' : 'text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-700/60'}`}
                  >
                    Create Account
                  </button>
                </div>
        </div>

        {createMode === 'existing' ? (
          <form onSubmit={handleHireExistingUser} className="mt-5 space-y-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
                    <input
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Search user by name/email"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <select
                      value={existingHireForm.userId}
                      onChange={(e) => setExistingHireForm((prev) => ({ ...prev, userId: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      value={existingHireForm.title}
                      onChange={(e) => setExistingHireForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
            </div>
            <button
              type="submit"
              disabled={hireExistingUser.isPending}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {hireExistingUser.isPending ? 'Hiring...' : 'Hire Existing User'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateStaffAccount} className="mt-5 space-y-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
                    <input
                      value={newAccountForm.name}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      value={newAccountForm.email}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <select
                      value={newAccountForm.departmentId}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      value={newAccountForm.title}
                      onChange={(e) => setNewAccountForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
            </div>
            <button
              type="submit"
              disabled={createStaffAccount.isPending}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {createStaffAccount.isPending ? 'Creating...' : 'Create Staff Account'}
            </button>
          </form>
        )}
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={Boolean(isEditModalOpen && selectedStaff)}
        onClose={() => setIsEditModalOpen(false)}
        kicker="Edit Staff"
        title={selectedStaff?.user.name || 'Staff'}
        description={selectedStaff ? selectedStaff.user.email : ''}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateSelectedStaff}
              disabled={
                updateStaffProfile.isPending || updateStaffAccountAccess.isPending
              }
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {updateStaffProfile.isPending || updateStaffAccountAccess.isPending
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        )}
      >
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <input
                value={editForm.employeeCode}
                onChange={(e) => setEditForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                placeholder="Employee code"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <select
                value={editForm.departmentId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {canEditAccountAccess && (
                <select
                  value={editForm.accountRole}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      accountRole: e.target.value as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value="USER">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              )}
        </div>
      </AdminSlideOverPanel>
    </div>
  )
}

export default AdminStaffPage
