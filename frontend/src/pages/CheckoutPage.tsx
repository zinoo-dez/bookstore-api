import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCart } from '@/services/cart'
import { useCreateOrder, useUploadPaymentReceipt, useValidatePromo } from '@/services/orders'
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
type PaymentProvider = 'KPAY' | 'WAVEPAY' | 'MPU' | 'VISA'

type PaymentMethodConfig = {
  label: string
  accountName: string
  accountNo: string
  qrCodeText?: string
  // Future option A: host/store a real QR image and render it directly.
  qrImageUrl?: string
  // Future option B: provide a deep link/payment link and generate QR from it.
  paymentLink?: string
}

const paymentConfig: Record<PaymentProvider, PaymentMethodConfig> = {
  KPAY: {
    label: 'KPay',
    accountName: 'Bookstore Myanmar Co., Ltd.',
    accountNo: 'KBZPAY-0998877665',
    // qrCodeText: 'KPAY-BOOKSTORE-0998877665',
    qrImageUrl: 'https://play-lh.googleusercontent.com/cnKJYzzHFAE5ZRepCsGVhv7ZnoDfK8Wu5z6lMefeT-45fTNfUblK_gF3JyW5VZsjFc4=w240-h480-rw',
    // paymentLink: 'https://play-lh.googleusercontent.com/cnKJYzzHFAE5ZRepCsGVhv7ZnoDfK8Wu5z6lMefeT-45fTNfUblK_gF3JyW5VZsjFc4=w240-h480-rw',
  },
  WAVEPAY: {
    label: 'WavePay',
    accountName: 'Bookstore Myanmar Co., Ltd.',
    accountNo: 'WAVE-09911223344',
    // qrCodeText: 'WAVEPAY-BOOKSTORE-09911223344',
    // qrImageUrl: 'https://play-lh.googleusercontent.com/rPq4GMCZy12WhwTlanEu7RzxihYCgYevQHVHLNha1VcY5SU1uLKHMd060b4VEV1r-OQ',
    paymentLink: 'https://play-lh.googleusercontent.com/rPq4GMCZy12WhwTlanEu7RzxihYCgYevQHVHLNha1VcY5SU1uLKHMd060b4VEV1r-OQ',
  },
  MPU: {
    label: 'MPU Transfer',
    accountName: 'Bookstore Myanmar Co., Ltd.',
    accountNo: 'MPU-AC-2200113344',
    // qrCodeText: 'MPU-BOOKSTORE-2200113344',
    qrImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRi2eNS2TMihkyUVYNlcGNppWyrg6L8fJ49ZQ&s',
    // paymentLink: 'https://payments.example.com/mpu/bookstore',
  },
  VISA: {
    label: 'Visa Card',
    accountName: 'Bookstore Myanmar Co., Ltd.',
    accountNo: 'VISA-MERCHANT-BOOKSTORE',
    qrCodeText: 'VISA-CARD-CHECKOUT',
    // qrImageUrl: 'https://your-cdn.example.com/qr/visa-bookstore.png',
    // paymentLink: 'https://payments.example.com/visa/bookstore',
  },
}

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { data: cartItems, isLoading } = useCart()
  const createOrderMutation = useCreateOrder()
  const uploadReceiptMutation = useUploadPaymentReceipt()
  const validatePromoMutation = useValidatePromo()

  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string>('')
  const [error, setError] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [promoMessage, setPromoMessage] = useState('')
  const [promoError, setPromoError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
  })

  const items = cartItems || []

  const selectedPayment = paymentProvider ? paymentConfig[paymentProvider] : null
  const receiptPreview = useMemo(() => {
    if (!receiptFile) return null
    if (receiptFile.type.startsWith('image/')) {
      return URL.createObjectURL(receiptFile)
    }
    return null
  }, [receiptFile])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton variant="logo" className="h-12 w-12 mx-auto" />
        <Skeleton className="h-8 w-40" />
      </div>
    )
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.book.price) * item.quantity, 0)
  const promoDiscount = validatePromoMutation.data?.valid ? validatePromoMutation.data.discountAmount : 0
  const tax = subtotal * 0.1
  const shipping = 0
  const total = subtotal - promoDiscount + tax + shipping

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Enter a promo code.')
      setPromoMessage('')
      return
    }

    try {
      setPromoError('')
      const result = await validatePromoMutation.mutateAsync(promoCode.trim())
      if (!result.valid) {
        setAppliedPromoCode(null)
        setPromoMessage('')
        setPromoError(result.message)
        return
      }
      setAppliedPromoCode(result.code)
      setPromoCode(result.code)
      setPromoMessage(`${result.code} applied. You saved $${result.discountAmount.toFixed(2)}.`)
      setPromoError('')
    } catch (err) {
      setAppliedPromoCode(null)
      setPromoMessage('')
      setPromoError(getErrorMessage(err))
    }
  }

  const handleRemovePromo = () => {
    setPromoCode('')
    setAppliedPromoCode(null)
    setPromoMessage('')
    setPromoError('')
    validatePromoMutation.reset()
  }

  const handleUploadReceipt = async () => {
    if (!paymentProvider) {
      setPaymentError('Please select a payment method first.')
      return
    }
    if (!receiptFile) {
      setPaymentError('Please choose a receipt file first.')
      return
    }

    try {
      setPaymentError('')
      const result = await uploadReceiptMutation.mutateAsync(receiptFile)
      setReceiptUrl(result.url)
    } catch (err) {
      setPaymentError(getErrorMessage(err))
    }
  }

  const onSubmit = async (data: ShippingData) => {
    if (!paymentProvider) {
      setPaymentError('Please select a payment method before placing the order.')
      return
    }
    if (!receiptUrl) {
      setPaymentError('Please upload your payment receipt before placing the order.')
      return
    }

    try {
      setError('')
      setPaymentError('')
      const order = await createOrderMutation.mutateAsync({
        ...data,
        paymentProvider,
        paymentReceiptUrl: receiptUrl,
        promoCode: appliedPromoCode ?? undefined,
      })
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900 dark:border dark:border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input {...register('fullName')} label="Full Name" placeholder="John Doe" error={errors.fullName?.message} />
                <Input {...register('email')} type="email" label="Email" placeholder="john@example.com" error={errors.email?.message} />
                <Input {...register('phone')} label="Phone Number" placeholder="+95 9 123 456789" error={errors.phone?.message} />
                <Input {...register('country')} label="Country" placeholder="Myanmar" error={errors.country?.message} />
                <div className="md:col-span-2">
                  <Input {...register('address')} label="Street Address" placeholder="No. 123, Main Road" error={errors.address?.message} />
                </div>
                <Input {...register('city')} label="City" placeholder="Yangon" error={errors.city?.message} />
                <Input {...register('state')} label="State / Region" placeholder="Yangon" error={errors.state?.message} />
                <Input {...register('zipCode')} label="ZIP / Postal Code" placeholder="11181" error={errors.zipCode?.message} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900 dark:border dark:border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Payment</h2>

              <div className="grid gap-3 md:grid-cols-3">
                {(Object.keys(paymentConfig) as PaymentProvider[]).map((provider) => {
                  const option = paymentConfig[provider]
                  const selected = paymentProvider === provider
                  return (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setPaymentProvider(provider)}
                      className={`rounded-lg border-2 p-3 text-left transition-colors ${
                        selected
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-1">Tap to show account / QR</p>
                    </button>
                  )
                })}
              </div>

              {selectedPayment ? (
                <div className="mt-4 rounded-xl border p-4 dark:border-slate-700">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">Account Name</p>
                      <p className="font-semibold">{selectedPayment.accountName}</p>
                      <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">Account No.</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold">{selectedPayment.accountNo}</p>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(selectedPayment.accountNo)}
                          className="rounded border px-2 py-1 text-xs dark:border-slate-600"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">QR</p>
                      <div className="mt-2 h-36 rounded-lg border border-dashed flex items-center justify-center text-center p-3 dark:border-slate-700">
                        {/*
                          Future render option A (real hosted image):
                          {selectedPayment.qrImageUrl ? (
                            <img
                              src={selectedPayment.qrImageUrl}
                              alt={`${selectedPayment.label} QR`}
                              className="h-full w-full object-contain"
                            />
                          ) : null}

                          Future render option B (generate from link/text):
                          Use selectedPayment.paymentLink with a QR library
                          (e.g. qrcode.react) to render dynamic QR.
                        */}
                        <div>
                          <p className="text-sm font-semibold">{selectedPayment.label} QR</p>
                          {/* Placeholder text disabled: replace with qrImageUrl render when ready. */}
                          {/* <p className="text-xs text-slate-500 mt-1 break-all">{selectedPayment.qrCodeText}</p> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Select a payment method to view account and QR details.
                </div>
              )}

              <div className="mt-4 rounded-xl border p-4 dark:border-slate-700 space-y-3">
                <p className="text-sm font-semibold">Upload Receipt</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    setReceiptFile(e.target.files?.[0] || null)
                    setReceiptUrl('')
                  }}
                  className="block w-full text-sm"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleUploadReceipt}
                    isLoading={uploadReceiptMutation.isPending}
                    disabled={!receiptFile || uploadReceiptMutation.isPending}
                  >
                    Upload Receipt
                  </Button>
                  {receiptUrl && <span className="text-sm text-emerald-600 dark:text-emerald-300">Receipt uploaded</span>}
                </div>
                {receiptPreview && (
                  <img src={receiptPreview} alt="Receipt preview" className="max-h-48 rounded border dark:border-slate-700" />
                )}
                {paymentError && (
                  <p className="text-sm text-rose-600 dark:text-rose-300">{paymentError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4 dark:bg-slate-900 dark:border dark:border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <BookCover src={item.book.coverImage} alt={item.book.title} className="w-16 h-20 rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.book.title}</p>
                      <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{item.book.author}</p>
                      <p className="text-sm text-gray-900 dark:text-slate-100">${Number(item.book.price).toFixed(2)} × {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium">${(Number(item.book.price) * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-lg border p-3 dark:border-slate-700">
                <p className="text-sm font-semibold mb-2">Promo Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  {appliedPromoCode ? (
                    <Button type="button" variant="outline" onClick={handleRemovePromo} className="h-10">
                      Remove
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      isLoading={validatePromoMutation.isPending}
                      className="h-10"
                    >
                      Apply
                    </Button>
                  )}
                </div>
                {promoMessage && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{promoMessage}</p>}
                {promoError && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{promoError}</p>}
                {!promoMessage && !promoError && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Enter a valid active promo code.
                  </p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2 dark:border-slate-800">
                <div className="flex justify-between text-gray-600 dark:text-slate-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Promo discount</span><span>-${promoDiscount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-slate-400"><span>Shipping</span><span className="text-green-600 dark:text-emerald-400">FREE</span></div>
                <div className="flex justify-between text-gray-600 dark:text-slate-400"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                <div className="border-t pt-2 dark:border-slate-800">
                  <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary-600">${total.toFixed(2)}</span></div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" isLoading={createOrderMutation.isPending}>
                Place Order
              </Button>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-rose-950/60 dark:border-rose-900/60">
                  <p className="text-red-600 text-sm text-center dark:text-rose-200">{error}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t text-center dark:border-slate-800">
                <p className="text-xs text-gray-600 mb-2 dark:text-slate-400">Manual Payment</p>
                <p className="text-xs text-slate-500">Selected: {selectedPayment?.label ?? 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

export default CheckoutPage
