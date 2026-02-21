import { Link } from 'react-router-dom'

const clauses = [
  {
    title: 'Use of Service',
    body: 'By using Treasure House, you agree to provide accurate account information and comply with marketplace and community guidelines.',
  },
  {
    title: 'Orders and Payments',
    body: 'Order placement confirms your intent to purchase. Pricing, taxes, shipping, and refund eligibility are shown before checkout.',
  },
  {
    title: 'Content and Reviews',
    body: 'User-generated content must not violate rights, laws, or platform integrity standards. We may moderate abusive submissions.',
  },
  {
    title: 'Liability and Support',
    body: 'We aim for reliable service, but availability may vary. For disputes or urgent issues, contact our support or legal team.',
  },
] as const

const TermsPage = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <nav className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">Terms</span>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Legal</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          These terms govern access to and use of Treasure House services, storefront features, and account tools.
        </p>
      </header>

      <section className="mt-8 space-y-4">
        {clauses.map((clause) => (
          <article key={clause.title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">{clause.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{clause.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default TermsPage
