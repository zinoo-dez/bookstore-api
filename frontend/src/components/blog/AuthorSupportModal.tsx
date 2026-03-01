import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Coffee, Copy, CreditCard, ExternalLink, QrCode } from 'lucide-react'

interface AuthorSupportModalProps {
  isOpen: boolean
  onClose: () => void
  authorName: string
  supportUrl?: string | null
  supportQrImage?: string | null
}

const PRESET_AMOUNTS = [3, 5, 10, 20]

type PaymentMode = 'card' | 'qr'

const AuthorSupportModal = ({
  isOpen,
  onClose,
  authorName,
  supportUrl,
  supportQrImage,
}: AuthorSupportModalProps) => {
  const [mode, setMode] = useState<PaymentMode>('card')
  const [selectedAmount, setSelectedAmount] = useState<number>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setMode('card')
    setSelectedAmount(5)
    setCustomAmount('')
    setCopied(false)
  }, [isOpen])

  const effectiveAmount = useMemo(() => {
    const parsed = Number(customAmount)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
    return selectedAmount
  }, [customAmount, selectedAmount])

  const qrSource = useMemo(() => {
    if (supportQrImage) return supportQrImage
    if (!supportUrl) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(supportUrl)}`
  }, [supportQrImage, supportUrl])

  const checkoutLabel = `Support $${effectiveAmount}`

  const openCheckout = () => {
    if (!supportUrl) return
    window.open(supportUrl, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async () => {
    if (!supportUrl) return
    await navigator.clipboard.writeText(supportUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-10">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
            aria-label="Close support modal"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="relative w-full max-w-xl overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_34px_110px_-42px_rgba(15,23,42,0.7)] dark:border-white/15 dark:bg-slate-900"
          >
            <div className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(140deg,#0f172a,#1e293b_55%,#334155)] px-6 pb-7 pt-6 text-white dark:border-white/10">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Support Author</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Buy {authorName} a Coffee</h2>
              <p className="mt-2 max-w-md text-sm text-white/75">
                Pick an amount, then complete payment on the author\'s secure checkout page.
              </p>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/70">
                <button
                  type="button"
                  onClick={() => setMode('card')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    mode === 'card'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Card
                </button>
                <button
                  type="button"
                  onClick={() => setMode('qr')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    mode === 'qr'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  <QrCode className="h-4 w-4" /> QR
                </button>
              </div>

              {mode === 'card' && (
                <section className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((amount) => {
                      const active = customAmount.length === 0 && selectedAmount === amount
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => {
                            setCustomAmount('')
                            setSelectedAmount(amount)
                          }}
                          className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                              : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500'
                          }`}
                        >
                          ${amount}
                        </button>
                      )
                    })}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom amount</label>
                    <div className="mt-2 flex items-center rounded-xl border border-slate-300 px-3 dark:border-slate-600">
                      <span className="text-sm text-slate-500 dark:text-slate-400">$</span>
                      <input
                        value={customAmount}
                        onChange={(event) => setCustomAmount(event.target.value)}
                        inputMode="decimal"
                        placeholder="0.00"
                        className="w-full border-0 bg-transparent px-2 py-2.5 text-sm text-slate-900 outline-none dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openCheckout}
                    disabled={!supportUrl}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <Coffee className="h-4 w-4" /> {checkoutLabel} <ExternalLink className="h-4 w-4" />
                  </button>
                </section>
              )}

              {mode === 'qr' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    {qrSource ? (
                      <img
                        src={qrSource}
                        alt={`QR code to support ${authorName}`}
                        className="h-56 w-56 rounded-xl border border-slate-200 bg-white object-cover p-2 dark:border-slate-600"
                      />
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Support link unavailable.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={!supportUrl}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                    <button
                      type="button"
                      onClick={openCheckout}
                      disabled={!supportUrl}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Open Checkout <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AuthorSupportModal
