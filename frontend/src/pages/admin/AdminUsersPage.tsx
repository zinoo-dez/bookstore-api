import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Pencil, Trash2, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, getErrorMessage } from '@/lib/api'
import Skeleton from '@/components/ui/Skeleton'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import { useDeleteUser, useUpdateUser, useUserStats } from '@/services/users'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  createdAt: string
}

const roleOptions: Array<User['role']> = ['USER', 'ADMIN', 'SUPER_ADMIN']

const AdminUsersPage = () => {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'role' | 'createdAt'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER' as User['role'],
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<User[]> => {
      const response = await api.get('/admin/users')
      return response.data
    },
  })

  const { data: userStats, isFetching: isStatsLoading } = useUserStats(viewingUser?.id || '')
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const showActionMessage = (text: string) => {
    setActionMessage(text)
    window.setTimeout(() => setActionMessage(''), 3200)
  }

  const allUsers = users || []

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const name = user.name || ''
      const email = user.email || ''
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [allUsers, roleFilter, searchTerm])

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'email':
          return a.email.localeCompare(b.email) * dir
        case 'role':
          return a.role.localeCompare(b.role) * dir
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
        default:
          return a.name.localeCompare(b.name) * dir
      }
    })
  }, [filteredUsers, sortDir, sortKey])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    })
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    if (!editForm.name.trim() || !editForm.email.trim()) {
      showActionMessage('Name and email are required.')
      return
    }

    try {
      await updateUser.mutateAsync({
        userId: editingUser.id,
        data: {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
        },
      })
      setEditingUser(null)
      showActionMessage('User updated.')
    } catch (error) {
      showActionMessage(getErrorMessage(error))
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      await deleteUser.mutateAsync(deletingUser.id)
      setDeletingUser(null)
      if (viewingUser?.id === deletingUser.id) {
        setViewingUser(null)
      }
      showActionMessage('User deleted.')
    } catch (error) {
      showActionMessage(getErrorMessage(error))
    }
  }

  const handleOrderClick = (orderId: string) => {
    setViewingUser(null)
    navigate(`/admin/orders?orderId=${encodeURIComponent(orderId)}`)
  }

  const densityPad = density === 'compact' ? 'py-2' : 'py-3'

  if (isLoading) {
    return (
      <div className="p-8 dark:text-slate-100 space-y-6">
        <Skeleton variant="logo" className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalUsers = allUsers.length
  const adminUsers = allUsers.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length
  const regularUsers = allUsers.filter((u) => u.role === 'USER').length

  return (
    <div className="p-8 dark:text-slate-100">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Users Management</h1>
            <p className="text-gray-600 mt-1 dark:text-slate-400">Manage user accounts and roles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto]">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All Roles</option>
            <option value="USER">Users</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Density</span>
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                  density === 'comfortable'
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Comfy
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
                  density === 'compact'
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {actionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="bg-white p-4 rounded-2xl border dark:bg-slate-900 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border dark:bg-slate-900 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">Regular Users</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-amber-300">{regularUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border dark:bg-slate-900 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">Administrators</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{adminUsers}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b dark:bg-slate-950/60 dark:border-slate-800 sticky top-0">
              <tr>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  Rank
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-2">
                    User Details
                    {sortKey === 'name' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('email')} className="inline-flex items-center gap-2">
                    Email
                    {sortKey === 'email' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('role')} className="inline-flex items-center gap-2">
                    Role
                    {sortKey === 'role' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-2">
                    Joined Date
                    {sortKey === 'createdAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className={`px-6 ${densityPad} text-left text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-800">
              {sortedUsers.map((user, index) => {
                const initial = user.name?.charAt(0).toUpperCase() || '?'
                const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                const bgColor = isAdmin ? 'bg-purple-500' : 'bg-blue-500'
                const isSelf = user.id === currentUser?.id

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/60 odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/60"
                  >
                    <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                      <span className="text-sm text-gray-500 dark:text-slate-500">#{index + 1}</span>
                    </td>
                    <td className={`px-6 ${densityPad}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center text-white font-bold`}>
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">ID: {user.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 ${densityPad}`}>
                      <span className="text-sm text-gray-600 dark:text-slate-400">{user.email}</span>
                    </td>
                    <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-amber-900/30 dark:text-amber-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className={`px-6 ${densityPad} whitespace-nowrap`}>
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className={`px-6 ${densityPad} whitespace-nowrap text-sm`}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                          aria-label="View user"
                          title="View user"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                          aria-label="Edit user"
                          title="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          disabled={isSelf}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-rose-400 hover:text-rose-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800"
                          aria-label="Delete user"
                          title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between dark:bg-slate-950 dark:border-slate-800">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Showing {filteredUsers.length} of {allUsers.length} users
          </div>
          <div className="text-sm text-slate-500">Actions now support view, edit, and delete.</div>
        </div>
      </div>

      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setViewingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => setViewingUser(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">User Overview</h2>
              <p className="mt-1 text-sm text-slate-500">{viewingUser.name} ({viewingUser.email})</p>

              {isStatsLoading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl border p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Orders</p>
                      <p className="text-lg font-semibold">{userStats?.stats.totalOrders ?? 0}</p>
                    </div>
                    <div className="rounded-xl border p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Spent</p>
                      <p className="text-lg font-semibold">${(userStats?.stats.totalSpent ?? 0).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Completed</p>
                      <p className="text-lg font-semibold">{userStats?.stats.completedOrders ?? 0}</p>
                    </div>
                    <div className="rounded-xl border p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Pending</p>
                      <p className="text-lg font-semibold">{userStats?.stats.pendingOrders ?? 0}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Orders</p>
                    <div className="max-h-52 overflow-auto rounded-xl border dark:border-slate-800">
                      {(userStats?.recentOrders || []).length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">No orders yet.</p>
                      ) : (
                        <ul className="divide-y dark:divide-slate-800">
                          {(userStats?.recentOrders || []).map((order) => (
                            <li key={order.id} className="p-3 text-sm">
                              <button
                                type="button"
                                onClick={() => handleOrderClick(order.id)}
                                className="w-full rounded-lg p-1 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Open in Orders Management"
                              >
                              <p className="font-medium text-slate-800 dark:text-slate-100">#{order.id.slice(-8)} - {order.status}</p>
                              <p className="text-slate-500">${Number(order.totalPrice).toFixed(2)} on {new Date(order.createdAt).toLocaleDateString()}</p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setEditingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => setEditingUser(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit User</h2>
              <p className="mt-1 text-sm text-slate-500">Update profile fields and role.</p>

              <div className="mt-4 space-y-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Name"
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: e.target.value as User['role'],
                    }))
                  }
                  disabled={editingUser.id === currentUser?.id}
                  className="w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {editingUser.id === currentUser?.id && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">Your own role cannot be changed.</p>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border px-4 py-2 text-sm dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={updateUser.isPending}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900"
                >
                  {updateUser.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={
          deletingUser
            ? `Delete ${deletingUser.name} (${deletingUser.email})? This action cannot be undone.`
            : ''
        }
        isLoading={deleteUser.isPending}
      />
    </div>
  )
}

export default AdminUsersPage
