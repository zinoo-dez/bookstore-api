import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useCreateContact } from '@/services/contact'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api'
import { isValidEmail } from '@/lib/contactValidation'

const TOPICS = [
  'Order issue',
  'Account problem',
  'Book availability',
  'Refund / return',
  'Author inquiry',
  'Publisher / distribution inquiry',
  'Business / marketing proposal',
  'Legal / technical issue',
  'Other',
] as const

type Topic = (typeof TOPICS)[number]
const FIELD_TRANSITION = { type: 'spring', stiffness: 340, damping: 30, mass: 0.72 } as const
const SPARKLES = [
  { x: -74, y: -18, delay: 0, color: 'bg-cyan-300', size: 'h-1.5 w-1.5', shape: 'rounded-full' },
  { x: -44, y: -46, delay: 0.03, color: 'bg-sky-300', size: 'h-2 w-2', shape: 'rounded-sm rotate-45' },
  { x: -8, y: -58, delay: 0.05, color: 'bg-indigo-300', size: 'h-1.5 w-1.5', shape: 'rounded-full' },
  { x: 28, y: -50, delay: 0.08, color: 'bg-violet-300', size: 'h-2 w-2', shape: 'rounded-sm rotate-45' },
  { x: 72, y: -16, delay: 0.12, color: 'bg-cyan-200', size: 'h-1.5 w-1.5', shape: 'rounded-full' },
  { x: -60, y: 30, delay: 0.08, color: 'bg-sky-200', size: 'h-1.5 w-1.5', shape: 'rounded-full' },
  { x: -18, y: 42, delay: 0.1, color: 'bg-indigo-200', size: 'h-1 w-1', shape: 'rounded-full' },
  { x: 22, y: 40, delay: 0.12, color: 'bg-violet-200', size: 'h-1 w-1', shape: 'rounded-full' },
  { x: 58, y: 28, delay: 0.14, color: 'bg-cyan-300', size: 'h-1.5 w-1.5', shape: 'rounded-full' },
] as const
const FLOW_STEPS = [
  'You submit one inquiry',
  'CS reviews and prioritizes',
  'Internal team routing if needed',
  'You get updates in Notifications',
]
const SUPPORT_BADGES = ['Avg reply <24h', 'Mon-Sun coverage', 'CS-owned communication']

const ContactSupportPage = () => {
  const { user } = useAuthStore()
  const createContact = useCreateContact()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    topic: '',
    orderId: '',
    bookTitle: '',
    isbn: '',
    penName: '',
    company: '',
    website: '',
    referenceId: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')
  const [sparkleBurst, setSparkleBurst] = useState(0)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const topicOptions = useMemo(() => TOPICS.map((t) => ({ label: t, value: t })), [])
  const topic = form.topic as Topic | ''

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address'
    if (!form.topic.trim()) next.topic = 'Topic is required'

    if ((topic === 'Order issue' || topic === 'Refund / return') && !form.orderId.trim()) {
      next.orderId = 'Order ID is required for this topic'
    }
    if (topic === 'Book availability' && !form.bookTitle.trim()) {
      next.bookTitle = 'Book title is required for this topic'
    }
    if (topic === 'Author inquiry') {
      if (!form.penName.trim()) next.penName = 'Pen name is required for author inquiries'
      if (!form.bookTitle.trim()) next.bookTitle = 'Book title is required for author inquiries'
    }
    if (topic === 'Publisher / distribution inquiry') {
      if (!form.company.trim()) next.company = 'Company is required for publisher inquiries'
      if (!form.website.trim()) next.website = 'Website is required for publisher inquiries'
    }
    if (topic === 'Business / marketing proposal' && !form.company.trim()) {
      next.company = 'Company is required for business/marketing proposals'
    }
    if (topic === 'Legal / technical issue' && !form.referenceId.trim()) {
      next.referenceId = 'Reference ID or URL is required for legal/technical issues'
    }

    if (!form.message.trim()) next.message = 'Message is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const triggerSparkleBurst = () => {
    setSparkleBurst((prev) => prev + 1)
    setIsCelebrating(true)
    if (celebrateTimerRef.current) {
      clearTimeout(celebrateTimerRef.current)
    }
    celebrateTimerRef.current = setTimeout(() => {
      setIsCelebrating(false)
      celebrateTimerRef.current = null
    }, 900)
  }

  useEffect(() => {
    return () => {
      if (celebrateTimerRef.current) {
        clearTimeout(celebrateTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    if (!validate()) return

    try {
      await createContact.mutateAsync({
        type: 'support',
        name: form.name,
        email: form.email,
        subject: form.topic,
        message: form.message,
        metadata: {
          orderId:
            topic === 'Order issue' || topic === 'Refund / return'
              ? form.orderId || undefined
              : undefined,
          bookTitle:
            topic === 'Book availability' || topic === 'Author inquiry'
              ? form.bookTitle || undefined
              : undefined,
          isbn:
            topic === 'Book availability' || topic === 'Author inquiry'
              ? form.isbn || undefined
              : undefined,
          penName: topic === 'Author inquiry' ? form.penName || undefined : undefined,
          company:
            topic === 'Publisher / distribution inquiry' || topic === 'Business / marketing proposal'
              ? form.company || undefined
              : undefined,
          website: topic === 'Publisher / distribution inquiry' ? form.website || undefined : undefined,
          referenceId: topic === 'Legal / technical issue' ? form.referenceId || undefined : undefined,
          requestedTeam:
            topic === 'Business / marketing proposal'
              ? 'MKT'
              : topic === 'Legal / technical issue'
                ? 'LEGAL'
                : topic === 'Author inquiry'
                  ? 'AUTHOR'
                  : topic === 'Publisher / distribution inquiry'
                    ? 'PUBLISHER'
                    : undefined,
        },
      })
      triggerSparkleBurst()
      setSuccess('Thank you. Customer Service received your message and will route it to the right team if needed.')
      setForm((prev) => ({
        ...prev,
        topic: '',
        orderId: '',
        bookTitle: '',
        isbn: '',
        penName: '',
        company: '',
        website: '',
        referenceId: '',
        message: '',
      }))
      setErrors({})
    } catch (error) {
      setSuccess('')
      setErrors({ form: getErrorMessage(error) })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/40 to-indigo-50/60 p-7 shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-indigo-200/45 blur-3xl" />
        <nav className="relative mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2 text-slate-300">/</span>
          <Link to="/contact" className="hover:text-primary-600">Contact</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-700">Support</span>
        </nav>
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Customer Service</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Tell Us What Happened</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-600">
            Share your issue once. We handle the conversation and route to legal, marketing, publishing, or specialist teams behind the scenes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUPPORT_BADGES.map((item) => (
              <span key={item} className="rounded-full border border-cyan-200 bg-white/85 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-cyan-800">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">How It Works</p>
          <div className="mt-4 space-y-3">
            {FLOW_STEPS.map((step, index) => (
              <div key={step} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Tip: include order ID, book title/ISBN, or company details when relevant for faster routing.
          </p>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_55px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
        {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={cn(
                'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                errors.name ? 'border-rose-300' : 'border-slate-200'
              )}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={cn(
                'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                errors.email ? 'border-rose-300' : 'border-slate-200'
              )}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Topic</label>
          <select
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className={cn(
              'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
              errors.topic ? 'border-rose-300' : 'border-slate-200'
            )}
          >
            <option value="">Select a topic</option>
            {topicOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.topic && <p className="mt-1 text-xs text-rose-600">{errors.topic}</p>}
        </div>

        <AnimatePresence initial={false}>
          {(topic === 'Order issue' || topic === 'Refund / return') && (
            <motion.div
              key="order-fields"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={FIELD_TRANSITION}
            >
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Order ID</label>
              <input
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                className={cn(
                  'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                  errors.orderId ? 'border-rose-300' : 'border-slate-200'
                )}
              />
              {errors.orderId && <p className="mt-1 text-xs text-rose-600">{errors.orderId}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {(topic === 'Book availability' || topic === 'Author inquiry') && (
            <motion.div
              key="book-fields"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={FIELD_TRANSITION}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Book title</label>
                <input
                  value={form.bookTitle}
                  onChange={(e) => setForm({ ...form, bookTitle: e.target.value })}
                  className={cn(
                    'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                    errors.bookTitle ? 'border-rose-300' : 'border-slate-200'
                  )}
                />
                {errors.bookTitle && <p className="mt-1 text-xs text-rose-600">{errors.bookTitle}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">ISBN (optional)</label>
                <input
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {topic === 'Author inquiry' && (
            <motion.div
              key="author-fields"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={FIELD_TRANSITION}
            >
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pen name</label>
              <input
                value={form.penName}
                onChange={(e) => setForm({ ...form, penName: e.target.value })}
                className={cn(
                  'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                  errors.penName ? 'border-rose-300' : 'border-slate-200'
                )}
              />
              {errors.penName && <p className="mt-1 text-xs text-rose-600">{errors.penName}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {(topic === 'Publisher / distribution inquiry' || topic === 'Business / marketing proposal') && (
            <motion.div
              key="business-fields"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={FIELD_TRANSITION}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className={cn(
                    'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                    errors.company ? 'border-rose-300' : 'border-slate-200'
                  )}
                />
                {errors.company && <p className="mt-1 text-xs text-rose-600">{errors.company}</p>}
              </div>
              {topic === 'Publisher / distribution inquiry' && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className={cn(
                      'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                      errors.website ? 'border-rose-300' : 'border-slate-200'
                    )}
                  />
                  {errors.website && <p className="mt-1 text-xs text-rose-600">{errors.website}</p>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {topic === 'Legal / technical issue' && (
            <motion.div
              key="legal-fields"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={FIELD_TRANSITION}
            >
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Reference ID or URL</label>
              <input
                value={form.referenceId}
                onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                className={cn(
                  'mt-2 w-full rounded-xl border px-3 py-2 text-sm',
                  errors.referenceId ? 'border-rose-300' : 'border-slate-200'
                )}
              />
              {errors.referenceId && <p className="mt-1 text-xs text-rose-600">{errors.referenceId}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Message</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={cn(
              'mt-2 min-h-[140px] w-full rounded-xl border px-3 py-2 text-sm',
              errors.message ? 'border-rose-300' : 'border-slate-200'
            )}
          />
          {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-flex">
            <AnimatePresence>
              {sparkleBurst > 0 && (
                <motion.div
                  key={sparkleBurst}
                  className="pointer-events-none absolute inset-0 z-10"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 }}
                >
                  {SPARKLES.map((sparkle, index) => (
                    <motion.span
                      key={`${sparkle.x}-${sparkle.y}-${index}`}
                      className={cn(
                        'absolute left-1/2 top-1/2 shadow-[0_0_16px_rgba(56,189,248,0.9)]',
                        sparkle.color,
                        sparkle.size,
                        sparkle.shape,
                      )}
                      initial={{ x: -2, y: -2, opacity: 0, scale: 0.6 }}
                      animate={{
                        x: sparkle.x,
                        y: sparkle.y,
                        opacity: [0, 1, 0],
                        scale: [0.6, 1.15, 0.7],
                      }}
                      transition={{
                        duration: 0.55,
                        delay: sparkle.delay,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={createContact.isPending}
              className={cn(
                'relative rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all',
                isCelebrating
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 shadow-[0_10px_28px_-12px_rgba(56,189,248,0.95)]'
                  : 'bg-primary-600 hover:bg-primary-700',
              )}
            >
              {createContact.isPending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  )
}

export default ContactSupportPage
