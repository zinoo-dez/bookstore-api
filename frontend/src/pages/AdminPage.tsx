import { useState } from 'react'
import BookFormModal from '@/components/admin/BookFormModal'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useBooks } from '@/services/books'
import { useOrders } from '@/services/orders'
import Loader from '@/components/ui/Loader'
import Button from '@/components/ui/Button'

const AdminPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: booksData, isLoading: booksLoading } = useBooks({ limit: 100 })
  const { data: orders, isLoading: ordersLoading } = useOrders()

  const handleAddBook = () => {
    setIsModalOpen(true)
  }

  const handleSubmitBook = (data: any) => {
    // Handle book creation logic here
    console.log('New book data:', data)
    setIsModalOpen(false)
  }

  if (booksLoading || ordersLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  const books = booksData?.books || []
  const allOrders = orders || []

  // Calculate statistics
  const totalBooks = books.length
  const totalOrders = allOrders.length
  const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const lowStockBooks = books.filter(book => book.stock > 0 && book.stock <= 10)
  const outOfStockBooks = books.filter(book => book.stock === 0)
  const recentOrders = allOrders.slice(0, 5)

  // Calculate orders by status
  const pendingOrders = allOrders.filter(order => order.status === 'PENDING').length
  const completedOrders = allOrders.filter(order => order.status === 'COMPLETED').length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your bookstore from here</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Books */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Books</p>
              <p className="text-3xl font-bold text-gray-900">{totalBooks}</p>
              <p className="text-xs text-gray-500 mt-1">
                {outOfStockBooks.length} out of stock
              </p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">
                {pendingOrders} pending
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </motion.div>

        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {completedOrders} completed
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-orange-600">
                {lowStockBooks.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Needs restocking
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="w-full" size="lg" onClick={handleAddBook}>
            ➕ Add New Book
          </Button>
          <Link to="/admin/orders" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              📋 Manage Orders
            </Button>
          </Link>
          <Link to="/admin/users" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              👥 Manage Users
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm">
              View All →
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-semibold text-sm">
                      ${Number(order.totalPrice).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.orderItems.length} items
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Low Stock Alerts</h2>
            <Link to="/admin/books" className="text-primary-600 hover:text-primary-700 text-sm">
              View All →
            </Link>
          </div>
          
          {lowStockBooks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All books well stocked! 🎉</p>
          ) : (
            <div className="space-y-3">
              {lowStockBooks.slice(0, 5).map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.author}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        book.stock <= 5
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {book.stock} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Out of Stock Books */}
      {outOfStockBooks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <span className="text-2xl mr-3">🚨</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Out of Stock Alert
              </h3>
              <p className="text-red-700 text-sm mb-3">
                {outOfStockBooks.length} book(s) are currently out of stock and need immediate restocking:
              </p>
              <div className="space-y-2">
                {outOfStockBooks.slice(0, 3).map((book) => (
                  <div key={book.id} className="text-sm text-red-800">
                    • {book.title} by {book.author}
                  </div>
                ))}
                {outOfStockBooks.length > 3 && (
                  <p className="text-sm text-red-700 font-medium">
                    + {outOfStockBooks.length - 3} more books
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <BookFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmitBook} />
    </motion.div>
  )
}

export default AdminPage
