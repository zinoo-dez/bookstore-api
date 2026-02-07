import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrders, useCancelOrder, useReorder, generateInvoice, type Order } from '@/services/orders'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import BookCover from '@/components/ui/BookCover'

const OrdersPage = () => {
  const navigate = useNavigate()
  const { data: orders, isLoading } = useOrders()
  const cancelOrderMutation = useCancelOrder()
  const reorderMutation = useReorder()

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Loader size="lg" text="Loading your orders..." />
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="You haven't placed any orders. Start shopping to see your orders here."
          action={
            <Link to="/books">
              <Button>Browse Books</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    setCancellingOrderId(orderId)
    try {
      await cancelOrderMutation.mutateAsync(orderId)
    } catch (error) {
      alert('Failed to cancel order. Please try again.')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const handleReorder = async (order: Order) => {
    try {
      const items = order.orderItems.map(item => ({
        bookId: item.bookId,
        quantity: item.quantity,
      }))
      await reorderMutation.mutateAsync(items)
      alert('Items added to cart!')
      navigate('/cart')
    } catch (error) {
      alert('Failed to add items to cart. Some items may be out of stock.')
    }
  }

  const handleDownloadInvoice = (order: Order) => {
    generateInvoice(order)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            {/* Order Header */}
            <div className="p-6 border-b">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-primary-600">
                    ${Number(order.totalPrice).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <BookCover
                      src={item.book.coverImage}
                      alt={item.book.title}
                      className="w-16 h-20 rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.book.title}</p>
                      <p className="text-sm text-gray-600">by {item.book.author}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Actions */}
              <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </Button>
                {order.status === 'COMPLETED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorder(order)}
                    disabled={reorderMutation.isPending}
                  >
                    {reorderMutation.isPending ? 'Adding...' : 'Reorder'}
                  </Button>
                )}
                {order.status === 'PENDING' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingOrderId === order.id}
                  >
                    {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadInvoice(order)}
                >
                  Download Invoice
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-mono font-medium">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-primary-600">
                        ${Number(selectedOrder.totalPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Items</h3>
                    <div className="space-y-3">
                      {selectedOrder.orderItems.map((item) => (
                        <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                          <BookCover
                            src={item.book.coverImage}
                            alt={item.book.title}
                            className="w-16 h-20 rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.book.title}</p>
                            <p className="text-sm text-gray-600">by {item.book.author}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.quantity} × ${Number(item.price).toFixed(2)} = ${(Number(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                  <Button onClick={() => handleDownloadInvoice(selectedOrder)}>
                    Download Invoice
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-700 text-sm mb-4">
          If you have any questions about your orders, please don't hesitate to contact us.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            Contact Support
          </Button>
          <Button variant="outline" size="sm">
            Track Order
          </Button>
          <Button variant="outline" size="sm">
            Return Policy
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default OrdersPage