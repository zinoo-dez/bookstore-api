import { useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from '@/lib/api'
import {
  useCreateRole,
  useDepartments,
  usePermissions,
  useReplaceRolePermissions,
  useRoles,
  type StaffRole,
} from '@/services/staff'

const MODULE_LABELS: Record<string, string> = {
  admin: 'Admin',
  department: 'Department',
  finance: 'Finance',
  hr: 'HR',
  inquiries: 'Inquiries',
  staff: 'Staff',
  support: 'Support',
  warehouse: 'Warehouse',
}

const ACTION_LABELS: Record<string, string> = {
  approve: 'Approve',
  assign: 'Assign',
  complete: 'Complete',
  create: 'Create',
  escalate: 'Escalate',
  export: 'Export',
  manage: 'Manage',
  receive: 'Receive',
  reject: 'Reject',
  reply: 'Reply',
  resolve: 'Resolve',
  review: 'Review',
  transfer: 'Transfer',
  update: 'Update',
  view: 'View',
}

const formatToken = (token: string) =>
  token
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const permissionLabel = (key: string) => {
  const parts = key.split('.')
  if (parts.length < 2) return formatToken(key)

  const [moduleKey, ...rest] = parts
  const actionKey = rest[rest.length - 1]
  const subjectTokens = rest.slice(0, -1)

  const moduleLabel = MODULE_LABELS[moduleKey] ?? formatToken(moduleKey)
  const actionLabel = ACTION_LABELS[actionKey] ?? formatToken(actionKey)
  const subjectLabel = subjectTokens.length > 0
    ? subjectTokens.map(formatToken).join(' ')
    : 'Records'

  return `${actionLabel} ${subjectLabel} (${moduleLabel})`
}

const AdminRolesPermissionsPage = () => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')

  const { data: departments = [] } = useDepartments()
  const { data: roles = [] } = useRoles()
  const { data: permissions = [] } = usePermissions()
  const createRole = useCreateRole()
  const replaceRolePermissions = useReplaceRolePermissions()

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId],
  )

  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [baselineKeys, setBaselineKeys] = useState<string[]>([])

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2400)
  }

  const syncSelectedRole = (role: StaffRole | undefined) => {
    if (!role) {
      setSelectedKeys([])
      setBaselineKeys([])
      return
    }

    const keys = role.permissions.map((link) => link.permission.key)
    setSelectedKeys(keys)
    setBaselineKeys(keys)
  }

  const onCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      showMessage('Role name is required.')
      return
    }

    try {
      await createRole.mutateAsync({
        name,
        code: code.trim() || undefined,
        departmentId: departmentId || undefined,
      })
      setName('')
      setCode('')
      setDepartmentId('')
      showMessage('Role created.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onSelectRole = (role: StaffRole) => {
    setSelectedRoleId(role.id)
    syncSelectedRole(role)
  }

  const togglePermission = (permissionKey: string) => {
    setSelectedKeys((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((key) => key !== permissionKey)
        : [...prev, permissionKey],
    )
  }

  const onSavePermissions = async () => {
    if (!selectedRoleId) {
      showMessage('Select role first.')
      return
    }

    try {
      await replaceRolePermissions.mutateAsync({
        id: selectedRoleId,
        permissionKeys: selectedKeys,
      })
      setBaselineKeys(selectedKeys)
      showMessage('Role permissions updated.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const filteredPermissions = useMemo(() => {
    const keyword = permissionSearch.trim().toLowerCase()
    if (!keyword) return permissions
    return permissions.filter((permission) => {
      const label = permissionLabel(permission.key).toLowerCase()
      const key = permission.key.toLowerCase()
      return label.includes(keyword) || key.includes(keyword)
    })
  }, [permissionSearch, permissions])

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, typeof permissions>()
    filteredPermissions.forEach((permission) => {
      const moduleKey = permission.key.split('.')[0] || 'misc'
      const current = groups.get(moduleKey) ?? []
      current.push(permission)
      groups.set(moduleKey, current)
    })
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredPermissions])

  useEffect(() => {
    if (groupedPermissions.length === 0) return
    setExpandedGroups((prev) => {
      const next = { ...prev }
      groupedPermissions.forEach(([group]) => {
        if (typeof next[group] === 'undefined') next[group] = true
      })
      return next
    })
  }, [groupedPermissions])

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole) return false
    if (selectedKeys.length !== baselineKeys.length) return true
    const baseline = new Set(baselineKeys)
    return selectedKeys.some((key) => !baseline.has(key))
  }, [baselineKeys, selectedKeys, selectedRole])

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  const toggleGroupAll = (groupPermissions: Array<{ key: string }>) => {
    if (!selectedRole) return
    const keys = groupPermissions.map((permission) => permission.key)
    const allSelected = keys.every((key) => selectedKeys.includes(key))
    if (allSelected) {
      setSelectedKeys((prev) => prev.filter((key) => !keys.includes(key)))
    } else {
      setSelectedKeys((prev) => Array.from(new Set([...prev, ...keys])))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Staff</p>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}

      <form onSubmit={onCreateRole} className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Create Role</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Role name"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
            placeholder="Role code (optional)"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Global role</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white dark:bg-amber-400 dark:text-slate-900"
          >
            Add Role
          </button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Roles</h2>
          <div className="mt-4 space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => onSelectRole(role)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${selectedRoleId === role.id ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <p className="font-semibold">{role.name}</p>
                <p className="text-xs text-slate-500">{role.code || 'NO_CODE'}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {role.departmentId ? departments.find((dept) => dept.id === role.departmentId)?.name : 'Global'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Permission Matrix</h2>
          <p className="mt-1 text-xs text-slate-500">{selectedRole ? selectedRole.name : 'Select a role to edit permissions'}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <input
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              placeholder="Search permissions"
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            {hasUnsavedChanges && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                Unsaved
              </span>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {groupedPermissions.map(([group, groupItems]) => {
              const selectedCount = groupItems.filter((permission) => selectedKeys.includes(permission.key)).length
              const expanded = expandedGroups[group] ?? true
              return (
                <div key={group} className="rounded-xl border dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="text-left text-sm font-semibold capitalize"
                    >
                      {group} ({selectedCount}/{groupItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGroupAll(groupItems)}
                      disabled={!selectedRole}
                      className="rounded border px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      {selectedCount === groupItems.length ? 'Clear' : 'Select all'}
                    </button>
                  </div>
                  {expanded && (
                    <div className="grid gap-2 border-t px-3 py-3 dark:border-slate-700">
                      {groupItems.map((permission) => (
                        <label key={permission.id} className="flex items-center gap-2 rounded border px-3 py-2 text-sm dark:border-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedKeys.includes(permission.key)}
                            onChange={() => togglePermission(permission.key)}
                            disabled={!selectedRole}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                              {permissionLabel(permission.key)}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {permission.key}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {groupedPermissions.length === 0 && (
              <p className="text-sm text-slate-500">No permissions match your search.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onSavePermissions}
            disabled={!selectedRole || replaceRolePermissions.isPending}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
          >
            {replaceRolePermissions.isPending ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminRolesPermissionsPage
