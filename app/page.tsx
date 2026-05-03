import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-48px)] bg-page flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">

        <p className="text-xs tracking-[0.35em] uppercase text-text-faint mb-8">
          mfp.buildquote.com.au
        </p>

        <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-5">
          <span className="text-text-primary">Welcome to </span>
          <span style={{ color: '#185D7A' }}>Build</span><span style={{ color: '#f97316' }}>Quote</span>
          <br />
          <span className="text-text-primary">Manufacturer Portal</span>
        </h1>

        <p className="text-text-secondary text-base max-w-md mx-auto leading-relaxed mb-14">
          Connecting Australian building materials manufacturers
          with building trade suppliers and builders.
        </p>

        {/* Login cards */}
        <div className="grid sm:grid-cols-2 gap-5 w-full max-w-xl text-left">

          {/* Supplier */}
          <Link
            href="/supplier/login"
            className="group bg-surface border border-border hover:border-brand rounded-2xl p-8 flex flex-col gap-5 transition-all hover:bg-surface-hover"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-text-primary text-lg leading-tight mb-1.5">
                Building Materials<br />Supplier
              </h2>
              <p className="text-text-faint text-sm leading-relaxed">
                Manage your product widgets, selections and supplier profile.
              </p>
            </div>
            <div className="flex items-center gap-2 text-brand text-sm font-semibold mt-auto">
              Log in
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </Link>

          {/* Manufacturer */}
          <Link
            href="/manufacturer/login"
            className="group bg-surface border border-border hover:border-brand rounded-2xl p-8 flex flex-col gap-5 transition-all hover:bg-surface-hover"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand">
                <path d="M2 20h20M4 20V10l6-6 6 6v10M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 8h2l2 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-text-primary text-lg leading-tight mb-1.5">
                Manufacturer<br />Portal
              </h2>
              <p className="text-text-faint text-sm leading-relaxed">
                View and verify your system cards, manage product data and listings.
              </p>
            </div>
            <div className="flex items-center gap-2 text-brand text-sm font-semibold mt-auto">
              Log in
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-faint">
        <span>© {new Date().getFullYear()} BuildQuote Pty Ltd</span>
        <div className="flex items-center gap-5">
          <Link href="/legal#terms" className="hover:text-text-secondary transition-colors">Terms of Use</Link>
          <Link href="/legal#privacy" className="hover:text-text-secondary transition-colors">Privacy Policy</Link>
          <Link href="/legal#disclaimer" className="hover:text-text-secondary transition-colors">Disclaimer</Link>
          <a href="mailto:hello@buildquote.com.au" className="hover:text-text-secondary transition-colors">Contact</a>
        </div>
        <a href="/admin" className="opacity-20 hover:opacity-50 transition-opacity">
          Admin
        </a>
      </footer>

    </div>
  )
}
