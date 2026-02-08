import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'

interface OrderStatusModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => void
  currentStatus: string
  orderId: string
  isLoading?: boolean
}

const OrderStatusModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentStatus,
  orderId,
  isLoading,
}: OrderStatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED'>(
    currentStatus as any
  )

  const handleSubmit = () => {
    onSubmit(selectedStatus)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black bg-opacity-50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 dark:bg-slate-900 dark:border dark:border-slate-800"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Update Order Status
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl dark:text-slate-500 dark:hover:text-amber-300"
              >
                ×
              </button>
            </div>

            {/* Order ID */}
            <p className="text-sm text-gray-600 mb-4 dark:text-slate-400">
              Order ID: <span className="font-mono font-medium">{orderId.slice(-8).toUpperCase()}</span>
            </p>

            {/* Status Options */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800">
                <input
                  type="radio"
                  name="status"
                  value="PENDING"
                  checked={selectedStatus === 'PENDING'}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Pending</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Order is being processed</div>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full dark:bg-amber-900/40 dark:text-amber-200">
                  PENDING
                </span>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800">
                <input
                  type="radio"
                  name="status"
                  value="COMPLETED"
                  checked={selectedStatus === 'COMPLETED'}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Completed</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Order has been delivered</div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full dark:bg-emerald-900/40 dark:text-emerald-200">
                  COMPLETED
                </span>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800">
                <input
                  type="radio"
                  name="status"
                  value="CANCELLED"
                  checked={selectedStatus === 'CANCELLED'}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Cancelled</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Order has been cancelled</div>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full dark:bg-rose-900/40 dark:text-rose-200">
                  CANCELLED
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={isLoading}
                className="flex-1"
                disabled={selectedStatus === currentStatus}
              >
                Update Status
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  )
}

export default OrderStatusModal
