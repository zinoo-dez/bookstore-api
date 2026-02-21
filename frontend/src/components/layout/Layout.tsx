import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

const Layout = () => {
  const location = useLocation()
  const isWriterRoute = location.pathname.startsWith('/blogs/write')

  return (
    <div className="luxe-shell min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer variant={isWriterRoute ? 'minimal' : 'default'} />
    </div>
  )
}

export default Layout
