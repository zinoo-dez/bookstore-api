import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useScroll, useTransform } from 'framer-motion'

const TRUST_CHIPS = [
  'Avg first reply: <24h',
  'Customer Service owns communication',
  'Internal escalation when needed',
]

const FAQS = [
  {
    q: 'How fast will I get a response?',
    a: 'Most inquiries receive a first response within 24 hours.',
  },
  {
    q: 'Can you route my case to marketing or legal?',
    a: 'Yes. Submit once to Customer Service and we route internally to the correct team.',
  },
  {
    q: 'Where can I check my case updates?',
    a: 'Use Notifications to follow updates and replies on your inquiry.',
  },
  {
    q: 'What should I include for book-related inquiries?',
    a: 'Include the book title and ISBN when available so we can resolve faster.',
  },
  {
    q: 'What if my issue is urgent?',
    a: 'Choose Legal / technical issue in the form and include a reference URL or ID.',
  },
]

const InquiryTiltCard = () => {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useTransform(my, [-35, 35], [9, -9])
  const rotateY = useTransform(mx, [-35, 35], [-10, 10])
  const glowX = useTransform(mx, [-35, 35], [35, 65])
  const glowY = useTransform(my, [-35, 35], [38, 62])
  const glowXPercent = useTransform(glowX, (value) => `${value}%`)
  const glowYPercent = useTransform(glowY, (value) => `${value}%`)

  const handleMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const py = ((event.clientY - rect.top) / rect.height) * 2 - 1
    mx.set(px * 35)
    my.set(py * 35)
  }

  const reset = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div style={{ perspective: 1100 }}>
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        <Link
          to="/contact/support"
          onMouseMove={handleMove}
          onMouseLeave={reset}
          onBlur={reset}
          className="group relative block overflow-hidden rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-white via-cyan-50/80 to-indigo-50 p-8 shadow-[0_26px_60px_-40px_rgba(14,116,144,0.6)] transition hover:shadow-[0_28px_70px_-35px_rgba(14,116,144,0.72)] dark:border-cyan-400/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(circle at var(--gx) var(--gy), rgba(56,189,248,0.22), rgba(99,102,241,0.08) 35%, transparent 62%)',
              ['--gx' as any]: glowXPercent,
              ['--gy' as any]: glowYPercent,
            }}
          />
          <div className="relative">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 shadow-sm dark:bg-cyan-500/20 dark:text-cyan-200">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12a10 10 0 10-11.5 9.9v-2.2a7.8 7.8 0 1110.9-7.1z" />
                <path d="M12 16v5l3-2" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">Start Inquiry</h3>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
              Orders, account issues, author requests, publisher onboarding, business/marketing proposals, and legal/technical concerns.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-white">
              Open form
              <span className="text-base leading-none">&rarr;</span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  )
}

const ContactPage = () => {
  const [faqQuery, setFaqQuery] = useState('')
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -36])
  const heroGlowScale = useTransform(scrollYProgress, [0, 0.35], [1, 1.12])
  const filteredFaqs = useMemo(() => {
    const needle = faqQuery.trim().toLowerCase()
    if (!needle) return FAQS
    return FAQS.filter(
      (item) =>
        item.q.toLowerCase().includes(needle) ||
        item.a.toLowerCase().includes(needle),
    )
  }, [faqQuery])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.section
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-[#101f3f] to-[#1a1a3b] p-9 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.82 }}
      >
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl"
          animate={{ x: [0, -14, 0], y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ scale: heroGlowScale }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-20 left-16 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl"
          animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ scale: heroGlowScale }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />

        <motion.div
          style={{ y: heroY }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
          className="relative"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Support Desk</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight text-white md:text-6xl">Talk To A Human, Not A Ticket Maze</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-200">
            Contact Customer Service first. We handle the conversation and route your case internally to marketing, legal, publishing, or any specialist team when needed.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TRUST_CHIPS.map((item) => (
              <span
                key={item}
                className="rounded-full border border-cyan-300/40 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-cyan-100 backdrop-blur"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        className="mt-7 grid gap-4 md:grid-cols-[1.5fr_1fr]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.82, delay: 0.04 }}
      >
        <InquiryTiltCard />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Quick Actions</p>
          <div className="mt-4 space-y-2">
            <Link to="/notifications" className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400/40 dark:hover:text-cyan-200">
              Track my case
            </Link>
            <a href="#faq" className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400/40 dark:hover:text-cyan-200">
              Browse common issues
            </a>
            <Link to="/contact/support" className="block rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
              Urgent legal/security issue
            </Link>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="faq"
        className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.82, delay: 0.06 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Quick Help</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">FAQ</h2>
          </div>
          <input
            value={faqQuery}
            onChange={(event) => setFaqQuery(event.target.value)}
            placeholder="Search help questions..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-300 md:w-72 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="mt-5 space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {filteredFaqs.map((item) => (
              <motion.article
                key={item.q}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/60"
              >
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.q}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</p>
              </motion.article>
            ))}
          </AnimatePresence>

          {filteredFaqs.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No FAQ matched your search.
            </p>
          )}
        </div>
      </motion.section>
    </div>
  )
}

export default ContactPage
