import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, MoreVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

type QuickAction = {
  label: string
  icon: typeof UserPlus
  onClick: () => void
  variant?: 'default' | 'success' | 'warning'
}

type QuickActionsMenuProps = {
  actions: QuickAction[]
}

const QuickActionsMenu = ({ actions }: QuickActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300'
      case 'warning':
        return 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
      default:
        return 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Quick actions"
      >
        <MoreVertical className="h-4 w-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition dark:text-slate-300 ${getVariantStyles(action.variant)}`}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default QuickActionsMenu
