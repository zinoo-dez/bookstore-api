import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useOrders } from '@/services/orders'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import BookCover from '@/components/ui/BookCover'

const OrdersPage = () => {
  const { data: orders, isLoading } = useOrders()

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
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {order.status === 'COMPLETED' && (
                  <Button variant="outline" size="sm">
                    Reorder
                  </Button>
                )}
                {order.status === 'PENDING' && (
                  <Button variant="danger" size="sm">
                    Cancel Order
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  Download Invoice
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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