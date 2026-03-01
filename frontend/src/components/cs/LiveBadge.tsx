import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type LiveBadgeProps = {
  count: number
  variant?: 'default' | 'urgent'
  size?: 'sm' | 'md'
}

const LiveBadge = ({ count, variant = 'default', size = 'md' }: LiveBadgeProps) => {
  const [prevCount, setPrevCount] = useState(count)
  const [isIncreasing, setIsIncreasing] = useState(false)

  useEffect(() => {
    if (count > prevCount) {
      setIsIncreasing(true)
      const timer = setTimeout(() => setIsIncreasing(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevCount(count)
  }, [count, prevCount])

  if (count === 0) return null

  const sizeClasses = size === 'sm' ? 'h-5 min-w-[20px] text-[10px]' : 'h-6 min-w-[24px] text-xs'
  const variantClasses = variant === 'urgent'
    ? 'bg-rose-500 text-white dark:bg-rose-600'
    : 'bg-blue-500 text-white dark:bg-blue-600'

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: isIncreasing ? [1, 1.2, 1] : 1,
        opacity: 1 
      }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center justify-center rounded-full px-1.5 font-bold ${sizeClasses} ${variantClasses}`}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  )
}

export default LiveBadge
