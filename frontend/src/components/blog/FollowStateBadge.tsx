import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const FollowStateBadge = ({
  followed,
  className,
}: {
  followed: boolean
  className?: string
}) => {
  return (
    <motion.span
      animate={{
        scale: followed ? 1.03 : 1,
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.7 }}
      className={cn(
        'relative inline-flex h-5 w-5 items-center justify-center rounded-full border',
        followed
          ? 'border-[#0f1a3d] bg-[#0f1a3d] text-white shadow-[0_8px_16px_rgba(15,26,61,0.28)] dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:shadow-[0_8px_16px_rgba(255,255,255,0.16)]'
          : 'border-slate-300 bg-white text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.08)] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:shadow-none',
        className,
      )}
      aria-hidden
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={followed ? 'check' : 'plus'}
          initial={{ opacity: 0, scale: 0.35, rotate: -90, y: 1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.35, rotate: 90, y: -1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 30, mass: 0.55 }}
          className="inline-flex items-center justify-center"
        >
          {followed ? <Check className="h-3 w-3 stroke-[2.6]" /> : <Plus className="h-3 w-3 stroke-[2.4]" />}
        </motion.span>
      </AnimatePresence>
      {followed && (
        <motion.span
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 0.24, scale: 1.55 }}
          exit={{ opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#0f1a3d] dark:bg-slate-100"
        />
      )}
    </motion.span>
  )
}

export default FollowStateBadge
