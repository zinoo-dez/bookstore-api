import { useState } from 'react'
import Button from '@/components/ui/Button'

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

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const finalChange = operation === 'add' ? stockChange : stockChange
        onSubmit(finalChange)
        setStockChange(0)
        setOperation('add')
    }

    const handleClose = () => {
        setStockChange(0)
        setOperation('add')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 dark:bg-slate-900 dark:border dark:border-slate-800">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Bulk Stock Update</h2>
                    <p className="text-gray-600 mb-6 dark:text-slate-400">
                        Update stock for {selectedCount} selected book{selectedCount !== 1 ? 's' : ''}
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                                Operation
                            </label>
                            <select
                                value={operation}
                                onChange={(e) => setOperation(e.target.value as 'add' | 'set')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            >
                                <option value="add">Add to current stock</option>
                                <option value="set">Set stock to specific value</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                                {operation === 'add' ? 'Stock to Add' : 'New Stock Value'}
                            </label>
                            <input
                                type="number"
                                value={stockChange}
                                onChange={(e) => setStockChange(Number(e.target.value))}
                                min={operation === 'set' ? 0 : undefined}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                required
                            />
                            {operation === 'add' && (
                                <p className="text-xs text-gray-500 mt-1 dark:text-slate-500">
                                    Use negative numbers to decrease stock
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? 'Updating...' : 'Update Stock'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default BulkStockUpdateModal
