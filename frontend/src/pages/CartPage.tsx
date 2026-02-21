import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/services/cart'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import BookCover from '@/components/ui/BookCover'

const CartPage = () => {
  const navigate = useNavigate()
  const { data: cartItems, isLoading } = useCart()
  const updateCartItem = useUpdateCartItem()
  const removeFromCart = useRemoveFromCart()

  const items = cartItems || []
  const totalPrice = items.reduce((sum, item) => sum + Number(item.book.price) * item.quantity, 0)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton variant="logo" className="h-12 w-12 mx-auto" />
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[0, 1].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-24 h-32 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Add some books to your cart to get started"
          action={
            <Link to="/books">
              <Button>Browse Books</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8 dark:text-slate-100"
    >
      <nav className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700 dark:text-slate-300">Cart</span>
      </nav>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary-600"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to Home
      </Link>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white rounded-lg shadow p-6 dark:bg-slate-900 dark:border dark:border-slate-800"
            >
              <div className="flex items-start gap-4">
                {/* Book Image */}
                <BookCover
                  src={item.book.coverImage}
                  alt={item.book.title}
                  className="w-24 h-32 rounded flex-shrink-0"
                />

                {/* Book Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 dark:text-slate-100">
                    {item.book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 dark:text-slate-400">by {item.book.author}</p>
                  <p className="text-primary-600 font-bold text-lg">
                    ${Number(item.book.price).toFixed(2)}
                  </p>
                  
                  {/* Stock Warning */}
                  {item.quantity >= item.book.stock && (
                    <p className="text-red-600 text-sm mt-2 dark:text-rose-300">
                      ⚠️ Only {item.book.stock} left in stock
                    </p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-4">
                  <button
                    onClick={() => removeFromCart.mutate(item.bookId)}
                    disabled={removeFromCart.isPending}
                    className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50 dark:text-rose-300 dark:hover:text-rose-200"
                  >
                    Remove
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartItem.mutate({ bookId: item.bookId, quantity: item.quantity - 1 })}
                      disabled={item.quantity <= 1 || updateCartItem.isPending}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center dark:bg-gray-700 hover:dark:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium dark:text-slate-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItem.mutate({ bookId: item.bookId, quantity: item.quantity + 1 })}
                      disabled={item.quantity >= item.book.stock || updateCartItem.isPending}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center dark:bg-gray-700 hover:dark:bg-gray-600"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-gray-900 font-semibold dark:text-slate-100">
                    ${(Number(item.book.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4 dark:bg-slate-900 dark:border dark:border-slate-800">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Shipping</span>
                <span className="text-green-600 dark:text-emerald-400">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Tax (estimated)</span>
                <span>${(totalPrice * 0.1).toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3 dark:border-slate-800">
                <div className="flex justify-between text-lg font-bold dark:text-slate-100">
                  <span>Total</span>
                  <span className="text-primary-600">
                    ${(totalPrice * 1.1).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCheckout}
              className="w-full mb-3"
              size="lg"
            >
              Proceed to Checkout
            </Button>

            <Link to="/books">
              <Button variant="outline" className="w-full dark:bg-transparent dark:text-slate-100 dark:hover:text-white" size="lg">
                Continue Shopping
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t dark:border-slate-800">
              <div className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Free shipping on all orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>↩️</span>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default CartPage
