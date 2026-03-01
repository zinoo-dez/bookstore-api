import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

type FooterProps = {
  variant?: 'default' | 'minimal'
}

const navColumns = [
  {
    title: 'Bookstore',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Browse Books', to: '/books' },
      { label: 'Blogs', to: '/blogs' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Profile', to: '/profile' },
      { label: 'Library', to: '/library' },
      { label: 'Orders', to: '/orders' },
      { label: 'Notifications', to: '/notifications' },
    ],
  },
  {
    title: 'Support & Legal',
    links: [
      { label: 'Support', to: '/contact/support' },
      { label: 'FAQ', to: '/contact#faq' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
] as const

const socialLinks = [
  { label: 'Instagram', to: '/contact' as const, icon: Instagram },
  { label: 'LinkedIn', to: '/contact' as const, icon: Linkedin },
  { label: 'YouTube', to: '/contact' as const, icon: Youtube },
  { label: 'Facebook', to: '/contact' as const, icon: Facebook },
] as const

const Footer = ({ variant = 'default' }: FooterProps) => {
  const rootRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (variant !== 'default') return
    if (!rootRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(rootRef.current)
    return () => observer.disconnect()
  }, [variant])

  if (variant === 'minimal') {
    return (
      <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
          <p>Writer Studio</p>
          <p>&copy; {new Date().getFullYear()} Treasure House</p>
        </div>
      </footer>
    )
  }

  return (
    <footer
      ref={rootRef}
      className={`relative mt-auto overflow-hidden bg-[#0f1726] text-slate-100 transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b16c]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_0%,rgba(148,163,184,0.14),transparent_68%),radial-gradient(45%_35%_at_0%_100%,rgba(120,113,108,0.16),transparent_72%),radial-gradient(40%_30%_at_100%_100%,rgba(30,58,95,0.25),transparent_75%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:repeating-linear-gradient(0deg,#ffffff_0,#ffffff_1px,transparent_1px,transparent_3px)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.18em] text-[#b8b0a5]">Treasure House</p>
          <p className="mt-4 text-xl font-medium leading-relaxed text-[#ece6da] sm:text-2xl">
            Curated for those who collect stories and value depth over noise.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr] lg:gap-14">
          {navColumns.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#a8a094]">{column.title}</p>
              <ul className="mt-5 space-y-4">
                {column.links.map((item) => (
                  <li key={`${column.title}-${item.label}-${item.to}`}>
                    <Link
                      to={item.to}
                      className="group relative inline-block text-[15px] font-medium leading-7 text-[#e8e2d5] transition-colors duration-200 hover:text-white"
                    >
                      {item.label}
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#d7b16c] transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#a8a094]">Contact</p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[#998f80]">Email</p>
                <a
                  href="mailto:support@treasurehouse.com"
                  className="mt-2 inline-block text-[15px] font-medium leading-7 text-[#ece6da] transition-colors hover:text-white"
                >
                  support@treasurehouse.com
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[#998f80]">Phone</p>
                <a
                  href="tel:+15551234567"
                  className="mt-2 inline-block text-[15px] font-medium leading-7 text-[#ece6da] transition-colors hover:text-white"
                >
                  (555) 123-4567
                </a>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    aria-label={item.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#6a7488] text-[#b7bfcd] transition duration-200 hover:-translate-y-0.5 hover:border-[#d7b16c] hover:text-[#f3e8d1]"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[#394153]/70 pt-6 text-xs text-[#a8afbc]">
          <p>&copy; {new Date().getFullYear()} Treasure House. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="transition-colors hover:text-[#f1e5cf]">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-[#f1e5cf]">Terms</Link>
            <Link to="/contact/support" className="transition-colors hover:text-[#f1e5cf]">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
