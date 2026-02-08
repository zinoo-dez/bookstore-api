import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCart } from '@/services/cart'
import { useCreateOrder } from '@/services/orders'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import BookCover from '@/components/ui/BookCover'
import Skeleton from '@/components/ui/Skeleton'
import { getErrorMessage } from '@/lib/api'

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 digits'),
  country: z.string().min(2, 'Country is required'),
})

type ShippingData = z.infer<typeof shippingSchema>

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { data: cartItems, isLoading } = useCart()
  const createOrderMutation = useCreateOrder()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
  })

  const items = cartItems || []

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton variant="logo" className="h-12 w-12 mx-auto" />
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <Skeleton className="h-6 w-52" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <Skeleton key={item} className="h-10 w-full" />
                ))}
                <div className="md:col-span-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-3">
                <Skeleton className="h-12 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.book.price) * item.quantity, 0)
  const tax = subtotal * 0.1
  const shipping = 0
  const total = subtotal + tax + shipping

  const onSubmit = async (_data: ShippingData) => {
    try {
      setError('')
      const order = await createOrderMutation.mutateAsync()
      navigate(`/order-confirmation/${order.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8 dark:text-slate-100"
    >
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900 dark:border dark:border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...register('fullName')}
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.fullName?.message}
                />
                <Input
                  {...register('email')}
                  type="email"
                  label="Email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                />
                <Input
                  {...register('phone')}
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  error={errors.phone?.message}
                />
                <Input
                  {...register('country')}
                  label="Country"
                  placeholder="United States"
                  error={errors.country?.message}
                />
                <div className="md:col-span-2">
                  <Input
                    {...register('address')}
                    label="Street Address"
                    placeholder="123 Main St, Apt 4B"
                    error={errors.address?.message}
                  />
                </div>
                <Input
                  {...register('city')}
                  label="City"
                  placeholder="New York"
                  error={errors.city?.message}
                />
                <Input
                  {...register('state')}
                  label="State / Province"
                  placeholder="NY"
                  error={errors.state?.message}
                />
                <Input
                  {...register('zipCode')}
                  label="ZIP / Postal Code"
                  placeholder="10001"
                  error={errors.zipCode?.message}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900 dark:border dark:border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              
              <div className="space-y-3 mb-6">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-800/60">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Credit / Debit Card</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">Pay with Visa, Mastercard, or American Express</div>
                  </div>
                  <div className="text-2xl">💳</div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-800/60">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">PayPal</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">Pay securely with your PayPal account</div>
                  </div>
                  <div className="text-2xl">🅿️</div>
                </label>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg dark:bg-slate-800/70 dark:border dark:border-slate-700">
                  <Input
                    label="Card Number"
                    placeholder="1234 5678 9012 3456"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                    />
                    <Input
                      label="CVV"
                      placeholder="123"
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400">
                    🔒 Your payment information is encrypted and secure
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4 dark:bg-slate-900 dark:border dark:border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <BookCover
                      src={item.book.coverImage}
                      alt={item.book.title}
                      className="w-16 h-20 rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.book.title}</p>
                      <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{item.book.author}</p>
                      <p className="text-sm text-gray-900 dark:text-slate-100">
                        ${Number(item.book.price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      ${(Number(item.book.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 dark:border-slate-800">
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>Shipping</span>
                  <span className="text-green-600 dark:text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 dark:border-slate-800">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                isLoading={createOrderMutation.isPending}
              >
                Place Order
              </Button>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-rose-950/60 dark:border-rose-900/60">
                  <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2 dark:text-rose-200">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </p>
                </div>
              )}

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t text-center dark:border-slate-800">
                <p className="text-xs text-gray-600 mb-2 dark:text-slate-400">Secure Checkout</p>
                <div className="flex justify-center gap-2 text-2xl">
                  <span>🔒</span>
                  <span>💳</span>
                  <span>✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

export default CheckoutPage
