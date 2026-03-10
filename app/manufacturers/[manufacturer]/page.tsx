'use client'
import { useMemo, useState, use } from 'react'
import manufacturersData from '@/data/manufacturers.json'

const manufacturers = manufacturersData as any[]

const APPLICATION_COLOURS: Record<string, string> = {
  'External Cladding': 'var(--brand)',
  'Internal Lining': 'var(--sand)',
  Flooring: 'var(--success)',
}

export default function ManufacturerPage({ params }: { params: Promise<{ manufacturer: string }> }) {
  const { manufacturer: slug } = use(params)
  const mfr = manufacturers.find((m) => m.slug === slug)

  const draft =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('draft')
      : null

  function withDraft(path: string) {
    return draft ? `${path}?draft=${encodeURIComponent(draft)}` : path
  }

  const [query, setQuery] = useState('')
  const [showRequest, setShowRequest] = useState(false)
  const [requestText, setRequestText] = useState('')
  const [requestEmail, setRequestEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  const allSystems = mfr?.systems || []

  const filtered = useMemo(() => {
    if (!query.trim()) return allSystems
    return allSystems.filter(
      (s: any) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.application?.toLowerCase().includes(query.toLowerCase()) ||
        s.description?.toLowerCase().includes(query.toLowerCase())
    )
  }, [allSystems, query])

  if (!mfr) {
    return (
      <div className="min-h-screen bg-page text-text-primary">
        <nav className="sticky top-0 z-30 border-b border-border bg-page/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <button
              className="text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-brand"
              onClick={() => window.history.back()}
            >
              ← Manufacturers
            </button>
            <a href={withDraft('/')} className="text-sm font-bold tracking-[0.2em]">
              BUILD<span className="text-brand">QUOTE</span>
            </a>
          </div>
        </nav>

        <main className="mx-auto max-w-4xl px-4 py-10 md:px-8">
          <p className="text-brand text-[11px] uppercase tracking-[0.28em]">404</p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-none md:text-6xl">
            Manufacturer Not Found
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
            We couldn&apos;t find a manufacturer with that name.
          </p>
          <a
            href={withDraft('/manufacturers')}
            className="mt-6 inline-flex rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
          >
            ← Back to Manufacturers
          </a>
        </main>
      </div>
    )
  }

  const hasSystems = allSystems.length > 0

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      await fetch('/api/request-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturer: mfr?.name || '',
          request: requestText,
          email: requestEmail,
        }),
      })
    } catch {}

    setRequestSent(true)
  }

  return (
    <div className="min-h-screen bg-page text-text-primary">
      <nav className="sticky top-0 z-30 border-b border-border bg-page/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <button
            className="text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-brand"
            onClick={() => window.history.back()}
          >
            ← Manufacturers
          </button>
          <a href={withDraft('/')} className="text-sm font-bold tracking-[0.2em]">
            BUILD<span className="text-brand">QUOTE</span>
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand">{mfr.category}</p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-none md:text-6xl">{mfr.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
            {mfr.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {mfr.website && (
              <a
                href={mfr.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl border border-brand bg-brand-subtle px-4 py-3 text-sm font-semibold text-brand transition-colors hover:border-brand-hover hover:text-brand-hover"
              >
                Visit Website ↗
              </a>
            )}
            {mfr.phone && (
              <a
                href={`tel:${mfr.phone}`}
                className="inline-flex rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
              >
                📞 {mfr.phone}
              </a>
            )}
          </div>

          <div className="mt-6 max-w-3xl rounded-2xl border border-sand/35 bg-sand/5 p-4">
            <div className="flex gap-3">
              <span className="pt-0.5 text-sand">⚠</span>
              <p className="text-sm leading-relaxed text-text-secondary">
                Component cards are compiled using AI and publicly available manufacturer data.
                Always verify product codes, specifications and compatibility on the manufacturer&apos;s
                website before placing your order.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {hasSystems ? (
            <>
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-text-faint">
                    Systems — {filtered.length} of {allSystems.length} available
                  </p>
                </div>

                <div className="w-full md:w-auto">
                  <input
                    className="w-full rounded-xl border border-border bg-ui px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand md:min-w-[320px]"
                    type="text"
                    placeholder="Search systems..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((sys: any) => (
                  <a
                    key={sys.slug}
                    href={withDraft(`/manufacturers/${mfr.slug}/${sys.slug}`)}
                    className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand hover:bg-surface-hover"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
                        style={{
                          color: APPLICATION_COLOURS[sys.application] || 'var(--brand)',
                          borderColor: APPLICATION_COLOURS[sys.application] || 'var(--brand)',
                        }}
                      >
                        {sys.application}
                      </span>

                      <div className="text-right">
                        {sys.warranty && (
                          <span className="text-[11px] uppercase tracking-[0.16em] text-text-faint">
                            {sys.warranty} warranty
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="mt-4 text-2xl font-bold uppercase leading-tight text-text-primary">
                      {sys.name}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{sys.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {sys.thickness && (
                        <span className="rounded-full border border-border bg-ui px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                          Thickness: {sys.thickness}
                        </span>
                      )}
                      {sys.panels && (
                        <span className="rounded-full border border-border bg-ui px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                          Panels: {sys.panels.length}
                        </span>
                      )}
                      {sys.accessories && (
                        <span className="rounded-full border border-border bg-ui px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                          Accessories: {sys.accessories.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 text-right text-lg text-text-secondary">↗</div>
                  </a>
                ))}

                <button
                  type="button"
                  onClick={() => setShowRequest(true)}
                  className="rounded-2xl border border-dashed border-border bg-surface p-5 text-left transition-colors hover:border-brand hover:bg-surface-hover"
                >
                  <div className="flex h-full flex-col justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border text-xl text-brand">
                      +
                    </div>
                    <h3 className="mt-4 text-2xl font-bold uppercase leading-tight text-text-primary">
                      Request a System
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      Use a {mfr.name} system regularly? Tell us what you need and we&apos;ll work to add
                      it to the portal.
                    </p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary">
              No systems found yet for this manufacturer.
            </div>
          )}
        </section>
      </main>

      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6">
            {!requestSent ? (
              <>
                <h2 className="text-2xl font-bold uppercase text-text-primary">Request a System</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Tell us which {mfr.name} system you want added.
                </p>

                <form onSubmit={handleRequestSubmit} className="mt-5 space-y-4">
                  <textarea
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="System name, link, or notes"
                    className="min-h-[120px] w-full rounded-xl border border-border bg-ui px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
                    required
                  />
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full rounded-xl border border-border bg-ui px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRequest(false)}
                      className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl border border-brand bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    >
                      Send Request
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold uppercase text-text-primary">Request Sent</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Thanks. We&apos;ll review your request and look at adding the system.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequest(false)
                    setRequestSent(false)
                    setRequestText('')
                    setRequestEmail('')
                  }}
                  className="mt-5 w-full rounded-xl border border-brand bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
