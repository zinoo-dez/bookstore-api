import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
const Layout = () => {
    return (<div className="min-h-screen flex flex-col">
      <Header />
      <motion.main className="flex-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
        <Outlet />
      </motion.main>
      <Footer />
    </div>);
};
export default Layout;
//# sourceMappingURL=Layout.js.map