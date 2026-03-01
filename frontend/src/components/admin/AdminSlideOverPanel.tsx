import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type AdminSlideOverPanelProps = {
  open: boolean
  onClose: () => void
  kicker?: string
  title: string
  description?: string
  widthClassName?: string
  children: ReactNode
  footer?: ReactNode
}

const AdminSlideOverPanel = ({
  open,
  onClose,
  kicker,
  title,
  description,
  widthClassName = 'max-w-[34rem]',
  children,
  footer,
}: AdminSlideOverPanelProps) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px]"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
        <motion.aside
          role="dialog"
          aria-modal="true"
          className={`fixed inset-y-4 right-4 z-50 w-[min(calc(100vw-2rem),42rem)] ${widthClassName} overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[-24px_0_80px_rgba(15,23,42,0.25)] dark:border-slate-700/80 dark:bg-slate-900`}
          initial={{ opacity: 0, x: 36, scale: 0.99 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.99 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <div className="flex h-full flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                {kicker ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    {kicker}
                  </p>
                ) : null}
                <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                {description ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>

            {footer ? (
              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
                {footer}
              </div>
            ) : null}
          </div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
)

export default AdminSlideOverPanel
