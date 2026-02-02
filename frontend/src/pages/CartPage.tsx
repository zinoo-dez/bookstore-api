import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cart'

const CartPage = () => {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <p className="text-gray-600">Your cart is empty</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-gray-600">by {item.author}</p>
              <p className="text-primary-600 font-bold">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.bookId)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold">Total: ${totalPrice.toFixed(2)}</span>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-800"
          >
            Clear Cart
          </button>
        </div>
        <button className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors">
          Proceed to Checkout
        </button>
      </div>
    </motion.div>
  )
}

export default CartPage