import { motion } from 'framer-motion'

const AdminPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="text-center text-gray-600">
        <p>Admin functionality coming soon...</p>
      </div>
    </motion.div>
  )
}

export default AdminPage