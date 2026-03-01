import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, User, MessageSquare } from 'lucide-react'
import { useInquiry } from '@/services/inquiries'
import ResponseTimer from './ResponseTimer'

type InquiryPreviewPanelProps = {
  inquiryId: string | null
  onClose: () => void
  onOpenFull: (id: string) => void
}

const InquiryPreviewPanel = ({ inquiryId, onClose, onOpenFull }: InquiryPreviewPanelProps) => {
  const { data: inquiry, isLoading } = useInquiry(inquiryId ?? '', Boolean(inquiryId))

  if (!inquiryId) return null

  return (
    <AnimatePresence>
      {inquiryId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Quick Preview
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inquiryId && onOpenFull(inquiryId)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Open full view"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-6 space-y-3">
                  <div className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ) : inquiry ? (
              <div className="space-y-6">
                {/* Title & Meta */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {inquiry.subject || 'Inquiry'}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {inquiry.assignedToStaff?.user?.name || 'Unassigned'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      {inquiry._count?.messages ?? 0} messages
                    </span>
                    <ResponseTimer updatedAt={inquiry.updatedAt} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {inquiry.type?.toUpperCase()}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {inquiry.status?.toUpperCase()}
                    </span>
                    {inquiry.priority?.toUpperCase() === 'URGENT' && (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                        URGENT
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Conversation
                  </h4>
                  <div className="space-y-3">
                    {inquiry.messages?.slice(0, 5).map((message) => (
                      <div
                        key={message.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">
                            {message.senderType === 'STAFF' ? 'Staff' : 'Customer'}
                          </span>
                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {message.message}
                        </p>
                      </div>
                    ))}
                    {(inquiry.messages?.length ?? 0) > 5 && (
                      <button
                        type="button"
                        onClick={() => inquiryId && onOpenFull(inquiryId)}
                        className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                      >
                        View all {inquiry.messages?.length ?? 0} messages
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                Inquiry not found
              </div>
            )}
          </div>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default InquiryPreviewPanel
