import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

type ResponseTimerProps = {
  updatedAt: string
  slaMinutes?: number
}

const ResponseTimer = ({ updatedAt, slaMinutes = 240 }: ResponseTimerProps) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const calculateElapsed = () => {
      const now = Date.now()
      const updated = new Date(updatedAt).getTime()
      const minutes = Math.floor((now - updated) / (1000 * 60))
      setElapsed(minutes)
    }

    calculateElapsed()
    const interval = setInterval(calculateElapsed, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [updatedAt])

  const percentage = Math.min((elapsed / slaMinutes) * 100, 100)
  const isUrgent = percentage > 90
  const isWarning = percentage > 70 && percentage <= 90

  const getColor = () => {
    if (isUrgent) return 'text-rose-600 dark:text-rose-400'
    if (isWarning) return 'text-amber-600 dark:text-amber-400'
    return 'text-emerald-600 dark:text-emerald-400'
  }

  const getBarColor = () => {
    if (isUrgent) return 'bg-rose-500'
    if (isWarning) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) return `${hours}h ${mins}m`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h`
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Clock className={`h-3.5 w-3.5 ${getColor()}`} />
      <span className={`text-xs font-semibold ${getColor()}`}>
        {formatTime(elapsed)}
      </span>
      {slaMinutes > 0 && (
        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${getBarColor()}`}
          />
        </div>
      )}
    </div>
  )
}

export default ResponseTimer
