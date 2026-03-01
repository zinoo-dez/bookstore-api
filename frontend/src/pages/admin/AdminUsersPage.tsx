import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, UserCheck, UserX } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import Skeleton from '@/components/ui/Skeleton'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import { useSetUserStatus, useUserStats, useUsers, type User } from '@/services/users'
import { useNavigate } from 'react-router-dom'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const AdminUsersPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all')
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'isActive' | 'createdAt'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [visibleColumns, setVisibleColumns] = useState({
    rank: true,
    user: true,
    email: true,
    status: true,
    joined: true,
    actions: true,
  })
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    user: User
    isActive: boolean
  } | null>(null)
  const { message: actionMessage, showMessage: showActionMessage } = useTimedMessage(3200)

  const { data: users, isLoading } = useUsers()
  const { data: userStats, isFetching: isStatsLoading } = useUserStats(viewingUser?.id || '')
  const setUserStatus = useSetUserStatus()

  const allUsers = users || []

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const name = user.name || ''
      const email = user.email || ''
      const query = searchTerm.toLowerCase()
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'banned' && !user.isActive)

      return (
        (name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
        ) &&
        matchesStatus
      )
    })
  }, [allUsers, searchTerm, statusFilter])

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'email':
          return a.email.localeCompare(b.email) * dir
        case 'isActive':
          return Number(a.isActive) === Number(b.isActive)
            ? a.name.localeCompare(b.name) * dir
            : (Number(a.isActive) - Number(b.isActive)) * dir
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

  const handleSetUserStatus = async (user: User, isActive: boolean) => {
    setPendingStatusChange({ user, isActive })
  }

  const confirmSetUserStatus = async () => {
    if (!pendingStatusChange) return
    try {
      await setUserStatus.mutateAsync({
        userId: pendingStatusChange.user.id,
        isActive: pendingStatusChange.isActive,
      })
      showActionMessage(pendingStatusChange.isActive ? 'User unbanned.' : 'User banned.')
      setPendingStatusChange(null)
    } catch (error) {
      showActionMessage(getErrorMessage(error))
    }
  }

  const handleOrderClick = (orderId: string) => {
    setViewingUser(null)
    navigate(`/admin/orders?orderId=${encodeURIComponent(orderId)}`)
  }

  const rowPad = 'py-3'
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
    { key: 'rank', label: 'Rank' },
    { key: 'user', label: 'User Details' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Account Status' },
    { key: 'joined', label: 'Joined Date' },
    { key: 'actions', label: 'Actions' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 p-8 dark:text-slate-100">
        <Skeleton variant="logo" className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
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
  const activeUsers = allUsers.filter((u) => u.isActive).length
  const bannedUsers = allUsers.filter((u) => !u.isActive).length

  return (
    <div className="p-8 dark:text-slate-100">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Users Management</h1>
            <p className="mt-1 text-gray-600 dark:text-slate-400">Regular user accounts only. Actions: view and ban control.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-300 px-4 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <ColumnVisibilityMenu
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            options={columnOptions}
          />
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {actionMessage}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`rounded-2xl border bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm dark:bg-slate-900 ${
            statusFilter === 'all'
              ? 'border-slate-400 ring-2 ring-slate-200 dark:border-slate-600 dark:ring-slate-700/60'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <p className="text-sm text-gray-600 dark:text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalUsers}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`rounded-2xl border bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm dark:bg-slate-900 ${
            statusFilter === 'active'
              ? 'border-emerald-400 ring-2 ring-emerald-100 dark:border-emerald-500 dark:ring-emerald-900/40'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <p className="text-sm text-gray-600 dark:text-slate-400">Active Users</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{activeUsers}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('banned')}
          className={`rounded-2xl border bg-white p-4 text-left transition hover:border-rose-300 hover:shadow-sm dark:bg-slate-900 ${
            statusFilter === 'banned'
              ? 'border-rose-400 ring-2 ring-rose-100 dark:border-rose-500 dark:ring-rose-900/40'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <p className="text-sm text-gray-600 dark:text-slate-400">Banned Users</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-300">{bannedUsers}</p>
        </button>
      </div>

      <div className="admin-table-wrapper">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[980px]">
            <thead className="admin-table-head sticky top-0">
              <tr>
                {visibleColumns.rank && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider text-gray-500`}>
                    Rank
                  </th>
                )}
                {visibleColumns.user && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider text-gray-500`}>
                    <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-2">
                      User Details
                      {sortKey === 'name' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.email && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider text-gray-500`}>
                    <button type="button" onClick={() => toggleSort('email')} className="inline-flex items-center gap-2">
                      Email
                      {sortKey === 'email' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.status && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider text-gray-500`}>
                    <button type="button" onClick={() => toggleSort('isActive')} className="inline-flex items-center gap-2">
                      Account Status
                      {sortKey === 'isActive' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.joined && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider text-gray-500`}>
                    <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-2">
                      Joined Date
                      {sortKey === 'createdAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.actions && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-wider text-gray-500`}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, index) => {
                const initial = user.name?.charAt(0).toUpperCase() || '?'

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="odd:bg-white even:bg-slate-50/60 hover:bg-gray-50 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 dark:hover:bg-slate-800/60"
                  >
                    {visibleColumns.rank && (
                      <td className={`whitespace-nowrap px-6 ${rowPad}`}>
                        <span className="text-sm text-gray-500 dark:text-slate-500">#{index + 1}</span>
                      </td>
                    )}
                    {visibleColumns.user && (
                      <td className={`px-6 ${rowPad}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                            {initial}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">ID: {user.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className={`px-6 ${rowPad}`}>
                        <span className="text-sm text-gray-600 dark:text-slate-400">{user.email}</span>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className={`whitespace-nowrap px-6 ${rowPad}`}>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
                          }`}
                        >
                          {user.isActive ? 'ACTIVE' : 'BANNED'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.joined && (
                      <td className={`whitespace-nowrap px-6 ${rowPad}`}>
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className={`whitespace-nowrap px-6 ${rowPad} text-sm`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:border-amber-300 hover:text-amber-300 dark:border-slate-800"
                            aria-label="View user"
                            title="View user"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSetUserStatus(user, !user.isActive)}
                            disabled={setUserStatus.isPending}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                              user.isActive
                                ? 'border-slate-200 hover:border-rose-400 hover:text-rose-500 dark:border-slate-800'
                                : 'border-slate-200 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-800'
                            }`}
                            aria-label={user.isActive ? 'Ban user' : 'Unban user'}
                            title={user.isActive ? 'Ban user' : 'Unban user'}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t bg-gray-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Showing {filteredUsers.length} of {allUsers.length} users
          </div>
          <div className="text-sm text-slate-500">Actions: view details and ban/unban only.</div>
        </div>
      </div>

      <AdminSlideOverPanel
        open={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        title={viewingUser ? `${viewingUser.name}` : 'User Overview'}
        description={viewingUser?.email}
        widthClassName="sm:max-w-2xl"
      >
        {isStatsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Orders</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{userStats?.stats.totalOrders ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Spent</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">${(userStats?.stats.totalSpent ?? 0).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Completed</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{userStats?.stats.completedOrders ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{userStats?.stats.pendingOrders ?? 0}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white/65 dark:border-slate-700 dark:bg-slate-900/35">
              <p className="border-b border-slate-200 px-4 py-3 text-sm font-semibold tracking-[0.16em] text-slate-500 dark:border-slate-700">
                RECENT ORDERS
              </p>
              <div className="max-h-72 overflow-auto">
                {(userStats?.recentOrders || []).length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">No orders yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {(userStats?.recentOrders || []).map((order) => (
                      <li key={order.id} className="p-3 text-sm">
                        <button
                          type="button"
                          onClick={() => handleOrderClick(order.id)}
                          className="w-full rounded-xl px-2 py-1 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Open in Orders Management"
                        >
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            #{order.id.slice(-8)} - {order.status}
                          </p>
                          <p className="text-slate-500">
                            ${Number(order.totalPrice).toFixed(2)} on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </AdminSlideOverPanel>

      <AnimatePresence>
        {pendingStatusChange && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
              onClick={() => setPendingStatusChange(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Confirm Action</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {pendingStatusChange.isActive ? 'Unban user account?' : 'Ban user account?'}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {pendingStatusChange.user.name} ({pendingStatusChange.user.email})
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingStatusChange(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSetUserStatus}
                  disabled={setUserStatus.isPending}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    pendingStatusChange.isActive
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {setUserStatus.isPending
                    ? 'Processing...'
                    : pendingStatusChange.isActive
                      ? 'Yes, Unban'
                      : 'Yes, Ban'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminUsersPage
