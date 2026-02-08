import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Pencil } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Skeleton from '@/components/ui/Skeleton'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

const AdminUsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'role' | 'createdAt'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<User[]> => {
      const response = await api.get('/admin/users')
      return response.data
    },
  })

  const allUsers = users || []
  
  // Filter users
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
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

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
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
  const adminUsers = allUsers.filter(u => u.role === 'ADMIN').length
  const regularUsers = allUsers.filter(u => u.role === 'USER').length

  return (
    <div className="p-8 dark:text-slate-100">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Users Management</h1>
            <p className="text-gray-600 mt-1 dark:text-slate-400">Manage user accounts and roles</p>
          </div>
        </div>

        {/* Search and Filter */}
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

      {/* Stats */}
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

      {/* Table */}
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
                const initial = user.name.charAt(0).toUpperCase()
                const bgColor = user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'
                
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
                          user.role === 'ADMIN'
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
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                          aria-label="View user"
                          title="View user"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-300 hover:text-amber-300 transition-colors dark:border-slate-800"
                          aria-label="Edit user"
                          title="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t bg-gray-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between dark:bg-slate-950 dark:border-slate-800">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Showing {filteredUsers.length} of {allUsers.length} users
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:border-slate-800 dark:hover:text-amber-300 dark:hover:border-amber-300">
              Previous
            </button>
            <button className="px-3 py-1 bg-primary-600 text-white rounded dark:bg-amber-400 dark:text-slate-900">
              1
            </button>
            <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:border-slate-800 dark:hover:text-amber-300 dark:hover:border-amber-300">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
