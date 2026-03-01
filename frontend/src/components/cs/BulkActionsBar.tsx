import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, ArrowUpCircle, CheckCircle2, Trash2 } from 'lucide-react'

type BulkActionsBarProps = {
  selectedCount: number
  onClear: () => void
  onAssign: () => void
  onEscalate: () => void
  onResolve: () => void
  onDelete: () => void
}

const BulkActionsBar = ({
  selectedCount,
  onClear,
  onAssign,
  onEscalate,
  onResolve,
  onDelete,
}: BulkActionsBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={onAssign}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                <UserPlus className="h-4 w-4" />
                Assign
              </motion.button>

              <motion.button
                type="button"
                onClick={onEscalate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Escalate
              </motion.button>

              <motion.button
                type="button"
                onClick={onResolve}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <CheckCircle2 className="h-4 w-4" />
                Resolve
              </motion.button>

              <motion.button
                type="button"
                onClick={onDelete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BulkActionsBar
