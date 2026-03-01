import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3 } from 'lucide-react'
import Button from '@/components/ui/Button'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

interface OrderStatusModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (status: 'PENDING' | 'CONFIRMED') => void
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
  const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'CONFIRMED'>(
    currentStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING'
  )

  useEffect(() => {
    if (!isOpen) return
    setSelectedStatus(currentStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING')
  }, [currentStatus, isOpen])

  const handleSubmit = () => {
    onSubmit(selectedStatus)
  }

  return (
    <AdminSlideOverPanel
      open={isOpen}
      onClose={onClose}
      title="Update Order Status"
      description={`Order #${orderId ? orderId.slice(-8).toUpperCase() : '-'}`}
      widthClassName="sm:max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={selectedStatus === currentStatus}>
            Update Status
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <label
          className={`block cursor-pointer rounded-2xl border p-4 transition ${
            selectedStatus === 'PENDING'
              ? 'border-amber-300 bg-amber-50/50 dark:border-amber-500/50 dark:bg-amber-900/10'
              : 'border-slate-200 hover:border-amber-200 dark:border-slate-700 dark:hover:border-amber-500/40'
          }`}
        >
          <input
            type="radio"
            name="status"
            value="PENDING"
            checked={selectedStatus === 'PENDING'}
            onChange={() => setSelectedStatus('PENDING')}
            className="sr-only"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-amber-100 p-1.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                <Clock3 className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Pending</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Order is being processed.</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              PENDING
            </span>
          </div>
        </label>

        <label
          className={`block cursor-pointer rounded-2xl border p-4 transition ${
            selectedStatus === 'CONFIRMED'
              ? 'border-blue-300 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-900/10'
              : 'border-slate-200 hover:border-blue-200 dark:border-slate-700 dark:hover:border-blue-500/40'
          }`}
        >
          <input
            type="radio"
            name="status"
            value="CONFIRMED"
            checked={selectedStatus === 'CONFIRMED'}
            onChange={() => setSelectedStatus('CONFIRMED')}
            className="sr-only"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-blue-100 p-1.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Confirmed</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Finance has verified payment and sent to warehouse delivery tasks.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
              CONFIRMED
            </span>
          </div>
        </label>
      </div>
    </AdminSlideOverPanel>
  )
}

export default OrderStatusModal
