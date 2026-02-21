export type PromoAction = {
  label: string
  href: string
}

export type PromoStripItem = {
  tag: string
  text: string
  action?: PromoAction
}

export type PromoCard = {
  title: string
  description: string
  action?: PromoAction
}

export type PromoCampaign = {
  key: string
  name: string
  enabled: boolean
  startsAt?: string
  endsAt?: string
  hero: {
    eyebrow: string
    title: string
    description: string
    action?: PromoAction
  }
  strip: PromoStripItem[]
  cards: PromoCard[]
}

/**
 * Marketing control panel (code-based):
 * - Set `forcedCampaignKey` to pin a campaign manually.
 * - Keep empty string to auto-pick by active date range.
 */
export const marketingConfig = {
  forcedCampaignKey: '',
  fallbackCampaignKey: 'evergreen',
}

export const promoCampaigns: PromoCampaign[] = [
  {
    key: 'christmas-2026',
    name: 'Christmas Campaign',
    enabled: true,
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
    hero: {
      eyebrow: 'Holiday Reading',
      title: 'Christmas Book Gifting Week',
      description: 'Holiday bundles, family picks, and cozy winter reads for every shelf.',
      action: { label: 'Shop Holiday Picks', href: '/books?category=Fiction' },
    },
    strip: [
      { tag: 'Holiday', text: 'Buy 2 get 1 free on selected holiday picks.' },
      { tag: 'Gift Wrap', text: 'Free gift wrapping for orders over $35.' },
      { tag: 'Express', text: 'Priority shipping available for holiday deadlines.' },
    ],
    cards: [
      {
        title: 'Cozy Fiction Bundle',
        description: 'Curated winter fiction at special pricing.',
        action: { label: 'View Bundle', href: '/books?genre=Fiction' },
      },
      {
        title: 'Gift Cards',
        description: 'Not sure what to pick? Let readers choose.',
        action: { label: 'Buy Gift Card', href: '/contact' },
      },
      {
        title: 'Family Reading Set',
        description: 'Kids + adult title pairings for shared reading.',
        action: { label: 'Explore Set', href: '/books' },
      },
    ],
  },
  {
    key: 'new-year-2027',
    name: 'New Year Campaign',
    enabled: true,
    startsAt: '2026-12-28',
    endsAt: '2027-01-20',
    hero: {
      eyebrow: 'New Year Goals',
      title: 'Start The Year With Better Reading Habits',
      description: 'Productivity, strategy, and personal growth titles for your next chapter.',
      action: { label: 'Build 2027 Reading List', href: '/books?category=Self-Help' },
    },
    strip: [
      { tag: 'Goal Mode', text: 'Top self-help and business books in one place.' },
      { tag: 'Planner', text: 'Download free reading planner with every January order.' },
      { tag: 'Fresh Start', text: 'Weekly recommendations tailored to your interests.' },
    ],
    cards: [
      {
        title: '30-Day Growth List',
        description: 'One practical title per week to build momentum.',
        action: { label: 'Start Now', href: '/books?category=Business' },
      },
      {
        title: 'Skill Upgrade Picks',
        description: 'Programming and tech books for hands-on learners.',
        action: { label: 'Browse Tech', href: '/books?category=Programming' },
      },
      {
        title: 'Habit Builder Collection',
        description: 'Proven books to improve focus and consistency.',
        action: { label: 'See Collection', href: '/books?genre=Self-Help' },
      },
    ],
  },
  {
    key: 'evergreen',
    name: 'Evergreen Campaign',
    enabled: true,
    hero: {
      eyebrow: 'This Week',
      title: 'Fresh Picks, Flash Deals, and New Arrivals',
      description: 'Discover trending reads, featured collections, and limited-time bookstore offers.',
      action: { label: 'Explore Promotions', href: '/books' },
    },
    strip: [
      { tag: 'Flash Sale', text: 'Up to 35% off selected bestsellers this week.' },
      { tag: 'Deal of the Day', text: 'Daily curated deal refreshed every morning.' },
      { tag: 'New Arrivals', text: 'Latest books are now available in the catalog.' },
    ],
    cards: [
      {
        title: 'Flash Sale',
        description: 'Limited-time offers on reader favorites.',
        action: { label: 'Shop Deals', href: '/books' },
      },
      {
        title: 'Deal of the Day',
        description: 'One special title with deep discount every day.',
        action: { label: 'See Today Deal', href: '/books' },
      },
      {
        title: 'Latest Arrival',
        description: 'Fresh additions curated by genre and popularity.',
        action: { label: 'View New Books', href: '/books' },
      },
    ],
  },
]

const parseDateBoundary = (value?: string, endOfDay = false): Date | null => {
  if (!value) return null
  const parsed = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isCampaignActive = (campaign: PromoCampaign, now: Date) => {
  if (!campaign.enabled) return false
  const start = parseDateBoundary(campaign.startsAt)
  const end = parseDateBoundary(campaign.endsAt, true)
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

export const getActivePromoCampaign = (now: Date = new Date()): PromoCampaign => {
  if (marketingConfig.forcedCampaignKey) {
    const forced = promoCampaigns.find((campaign) => campaign.key === marketingConfig.forcedCampaignKey)
    if (forced && forced.enabled) return forced
  }

  const activeByDate = promoCampaigns.find((campaign) => isCampaignActive(campaign, now))
  if (activeByDate) return activeByDate

  return promoCampaigns.find((campaign) => campaign.key === marketingConfig.fallbackCampaignKey) ?? promoCampaigns[0]
}
