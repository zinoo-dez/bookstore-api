import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getActivePromoCampaign } from '@/content/promotions'

type PromoTickerProps = {
  className?: string
}

const PromoTicker = ({ className }: PromoTickerProps) => {
  const campaign = getActivePromoCampaign()
  const items = campaign.strip
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [items.length])

  if (items.length === 0) return null

  const item = items[current]

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          <Megaphone className="h-3.5 w-3.5" />
          {item.tag}
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.text}</p>
        {item.action && (
          <Link to={item.action.href} className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
            {item.action.label}
          </Link>
        )}
      </div>
    </div>
  )
}

export default PromoTicker
