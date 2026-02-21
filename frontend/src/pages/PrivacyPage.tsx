import { Link } from 'react-router-dom'

const sections = [
  {
    title: 'Information We Collect',
    body: 'We collect account, order, and reading activity data needed to operate your library, purchases, and support requests.',
  },
  {
    title: 'How We Use Data',
    body: 'Data is used to process orders, improve recommendations, secure accounts, and provide customer service.',
  },
  {
    title: 'Data Sharing',
    body: 'We only share data with trusted service providers required to operate payment, delivery, and security systems.',
  },
  {
    title: 'Your Controls',
    body: 'You can update profile details, manage notifications, and request account data updates through support.',
  },
] as const

const PrivacyPage = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <nav className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">Privacy</span>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Legal</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          This page outlines how Treasure House handles personal information and protects reader data.
        </p>
      </header>

      <section className="mt-8 space-y-4">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default PrivacyPage
