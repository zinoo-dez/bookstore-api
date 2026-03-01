import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'

const Layout = () => {
  const location = useLocation()
  const isWriterRoute = location.pathname.startsWith('/blogs/write')

  return (
    <div className="luxe-shell min-h-screen flex flex-col">
      <Navbar />
      <ScrollProgressBar topClassName="top-0" widthClassName="w-full" />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isWriterRoute && (
        <div
          aria-hidden
          className="pointer-events-none h-4 bg-gradient-to-b from-transparent to-[#0f1726]/30 dark:to-[#0f1726]/42"
        />
      )}
      <Footer variant={isWriterRoute ? 'minimal' : 'default'} />
    </div>
  )
}

export default Layout
