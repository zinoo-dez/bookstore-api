import { Outlet } from 'react-router-dom'
import CSSidebar from '@/components/cs/CSSidebar'

const CSLayout = () => {
  return (
    <div className="luxe-shell min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex max-w-[1300px] gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <CSSidebar />
        <main className="min-w-0 flex-1 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CSLayout
