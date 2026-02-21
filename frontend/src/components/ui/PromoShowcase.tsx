import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getActivePromoCampaign } from '@/content/promotions'

type PromoShowcaseProps = {
  className?: string
  compact?: boolean
}

const PromoShowcase = ({ className, compact = false }: PromoShowcaseProps) => {
  const campaign = getActivePromoCampaign()

  return (
    <section
      className={cn(
        'rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-[0_24px_80px_-45px_rgba(2,6,23,0.9)] dark:border-slate-700/70',
        className,
      )}
    >
      <div className={cn('grid gap-6', compact ? 'lg:grid-cols-[1fr_auto]' : 'lg:grid-cols-[1.1fr_1fr]')}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-300/90">{campaign.hero.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{campaign.hero.title}</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">{campaign.hero.description}</p>
          {campaign.hero.action && (
            <Link
              to={campaign.hero.action.href}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              <Sparkles className="h-4 w-4" />
              {campaign.hero.action.label}
            </Link>
          )}
        </div>

        {!compact && (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {campaign.cards.slice(0, 3).map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-sm font-bold text-slate-100">{card.title}</p>
                <p className="mt-1 text-xs text-slate-300">{card.description}</p>
                {card.action && (
                  <Link to={card.action.href} className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-amber-300 hover:text-amber-200">
                    {card.action.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PromoShowcase
