import { BookOpen, ShieldCheck, Sparkles } from 'lucide-react'

const CSKnowledgePage = () => {
  return (
    <div className="space-y-12">
      <section className="cs-card rounded-2xl p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f7465] dark:text-slate-400">
          Knowledge Base
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#2a241d] dark:text-white">
          Customer Service playbooks
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5f5548] dark:text-slate-400">
          Quick references for common issues, escalation paths, and response standards.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="cs-card rounded-2xl p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7465] dark:text-slate-400">
            <BookOpen className="h-4 w-4" />
            Response guide
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#5f5548] dark:text-slate-300">
            Templates for refunds, delivery delays, and account issues with tone guidance.
          </p>
        </div>
        <div className="cs-card rounded-2xl p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7465] dark:text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            Escalation map
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#5f5548] dark:text-slate-300">
            When to involve Finance, Legal, or Warehouse and how to hand off context.
          </p>
        </div>
        <div className="cs-card rounded-2xl p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7465] dark:text-slate-400">
            <Sparkles className="h-4 w-4" />
            Quality checklist
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#5f5548] dark:text-slate-300">
            SLA standards, empathy cues, and resolution summaries before closing a case.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CSKnowledgePage
