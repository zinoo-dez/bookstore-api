import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AdminSidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
