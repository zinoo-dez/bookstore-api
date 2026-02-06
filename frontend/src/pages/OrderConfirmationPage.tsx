import { useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useOrder } from '@/services/orders'
import Button from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading, error } = useOrder(orderId || '')

  useEffect(() => {
    if (!orderId) {
      navigate('/orders')
    }
  }, [orderId, navigate])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Loader />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Link to="/orders">
            <Button>View Order History</Button>
          </Link>
        </div>
      </div>
    )
  }

  const orderNumber = order.id.slice(-8).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto px-4 py-12"
    >
      {/* Success Icon */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
        >
          <span className="text-5xl">✓</span>
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-gray-600">
          Thank you for your purchase. Your order has been received.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="border-b pb-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-xl font-bold text-gray-900">#{orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {order.status}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.book.title}</p>
                  <p className="text-sm text-gray-600">by {item.book.author}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Paid</span>
            <span className="text-primary-600">${Number(order.totalPrice).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">📧</span>
            <span>You'll receive an order confirmation email shortly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">📦</span>
            <span>Your order will be processed and shipped within 2-3 business days</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">🚚</span>
            <span>You'll receive tracking information once your order ships</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/orders" className="flex-1">
          <Button variant="outline" className="w-full">
            View Order History
          </Button>
        </Link>
        <Link to="/books" className="flex-1">
          <Button className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Support */}
      <div className="text-center mt-8 text-sm text-gray-600">
        <p>Need help? Contact us at <a href="mailto:support@bookstore.com" className="text-primary-600 hover:underline">support@bookstore.com</a></p>
      </div>
    </motion.div>
  )
}

export default OrderConfirmationPage