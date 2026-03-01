import { useState } from 'react'
import Button from '@/components/ui/Button'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

interface BulkStockUpdateModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (stockChange: number) => void
    selectedCount: number
    isLoading?: boolean
}

const BulkStockUpdateModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedCount,
    isLoading = false,
}: BulkStockUpdateModalProps) => {
    const [stockChange, setStockChange] = useState<number>(0)
    const [operation, setOperation] = useState<'add' | 'set'>('add')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(stockChange)
        setStockChange(0)
        setOperation('add')
    }

    const handleClose = () => {
        setStockChange(0)
        setOperation('add')
        onClose()
    }

    return (
        <AdminSlideOverPanel
            open={isOpen}
            onClose={handleClose}
            title="Bulk Stock Update"
            description={`Update stock for ${selectedCount} selected book${selectedCount !== 1 ? 's' : ''}`}
            widthClassName="sm:max-w-xl"
            footer={
                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" form="bulk-stock-update-form" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Stock'}
                    </Button>
                </div>
            }
        >
            <form id="bulk-stock-update-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Operation
                    </label>
                    <select
                        value={operation}
                        onChange={(e) => setOperation(e.target.value as 'add' | 'set')}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                        <option value="add">Add to current stock</option>
                        <option value="set">Set stock to specific value</option>
                    </select>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {operation === 'add' ? 'Stock to Add' : 'New Stock Value'}
                    </label>
                    <input
                        type="number"
                        value={Number.isNaN(stockChange) ? '' : stockChange}
                        onChange={(e) => setStockChange(Number(e.target.value))}
                        min={operation === 'set' ? 0 : undefined}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        required
                    />
                    {operation === 'add' && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Use negative numbers to decrease stock.
                        </p>
                    )}
                </div>
            </form>
        </AdminSlideOverPanel>
    )
}

export default BulkStockUpdateModal
