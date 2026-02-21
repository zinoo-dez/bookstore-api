import { Clock3, Mail, Phone, UsersRound } from 'lucide-react'

const leadership = [
  {
    name: 'Elena Carter',
    role: 'Head of Reader Services',
    focus: 'Escalation review and response standards',
    availability: 'In office',
  },
  {
    name: 'Marcus Hill',
    role: 'Service Operations Manager',
    focus: 'Queue distribution and case load balancing',
    availability: 'In office',
  },
]

const teamPods = [
  {
    pod: 'Reader Care',
    members: '6 specialists',
    scope: 'Order support, delivery updates, account access',
    channel: 'readercare@bookstore.com',
    tone: 'border-[#d6cab9] bg-[#f5eee4] text-[#5f5548]',
  },
  {
    pod: 'Author & Publisher',
    members: '4 specialists',
    scope: 'Rights inquiries, metadata changes, release issues',
    channel: 'partnersupport@bookstore.com',
    tone: 'border-[#c8d2e1] bg-[#edf2f8] text-[#465d7c]',
  },
  {
    pod: 'Priority Desk',
    members: '3 specialists',
    scope: 'Escalated cases and executive handoffs',
    channel: 'prioritydesk@bookstore.com',
    tone: 'border-[#e6c9c4] bg-[#faeeec] text-[#8f4b45]',
  },
]

const CSTeamPage = () => {
  return (
    <div className="space-y-12">
      <section className="cs-card rounded-2xl p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f7465] dark:text-slate-400">
          Team
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#2a241d] dark:text-white">
          Customer service team
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5f5548] dark:text-slate-300">
          The team is organized into focused service pods with shared response standards and calm handoffs.
        </p>
      </section>

      <section className="cs-card rounded-2xl p-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7465] dark:text-slate-400">
          <UsersRound className="h-4 w-4" />
          Leadership
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {leadership.map((person) => (
            <article
              key={person.name}
              className="rounded-xl border border-[#e3d8c8] bg-[#fffdf9]/95 p-6 shadow-[0_16px_44px_-38px_rgba(35,30,23,0.35)] dark:border-white/10 dark:bg-white/[0.04]"
            >
              <p className="text-lg font-semibold text-[#2a241d] dark:text-white">{person.name}</p>
              <p className="mt-1 text-sm text-[#706557] dark:text-slate-300">{person.role}</p>
              <p className="mt-4 text-sm leading-relaxed text-[#5f5548] dark:text-slate-300">{person.focus}</p>
              <p className="mt-4 inline-flex items-center rounded-full border border-[#d9cdbd] bg-[#f4ede3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f5548] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {person.availability}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="cs-card rounded-2xl p-7">
        <h2 className="text-xl font-semibold text-[#2a241d] dark:text-white">Service pods</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {teamPods.map((pod) => (
            <article
              key={pod.pod}
              className="rounded-xl border border-[#e3d8c8] bg-[#fffdf9]/95 p-6 shadow-[0_16px_44px_-38px_rgba(35,30,23,0.35)] dark:border-white/10 dark:bg-white/[0.04]"
            >
              <p className="text-base font-semibold text-[#2a241d] dark:text-white">{pod.pod}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#776c5e] dark:text-slate-400">{pod.members}</p>
              <p className="mt-4 text-sm leading-relaxed text-[#5f5548] dark:text-slate-300">{pod.scope}</p>
              <p className={`mt-4 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${pod.tone}`}>
                Active
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-[#74695b] dark:text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                {pod.channel}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="cs-card rounded-2xl p-7">
        <h2 className="text-xl font-semibold text-[#2a241d] dark:text-white">Coverage window</h2>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#5f5548] dark:text-slate-300">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dfd3c3] bg-[#fffdf9] px-4 py-2">
            <Clock3 className="h-4 w-4" />
            Daily: 08:00 to 22:00
          </p>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dfd3c3] bg-[#fffdf9] px-4 py-2">
            <Phone className="h-4 w-4" />
            Internal line: +1 (800) 555-0188
          </p>
        </div>
      </section>
    </div>
  )
}

export default CSTeamPage
