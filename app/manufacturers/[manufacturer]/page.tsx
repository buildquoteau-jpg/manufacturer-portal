'use client'

import { useEffect, useMemo, useState, use } from 'react'
import { supabase } from '@/lib/supabase/client'

type Manufacturer = {
  id: string
  name: string
  slug: string
  description?: string | null
  category?: string | null
  website?: string | null
  phone?: string | null
}

type SystemRow = {
  id: string
  name: string
  slug: string
  description?: string | null
  category?: string | null
  sort_order?: number | null
  verification_status?: string | null
  source_label?: string | null
  source_url?: string | null
}

const CATEGORY_COLOURS: Record<string, string> = {
  cladding: 'var(--brand)',
  'internal lining': 'var(--sand)',
  flooring: 'var(--success)',
  weatherboard: 'var(--brand)',
  trim: 'var(--sand)',
  decking: 'var(--success)',
  eaves: 'var(--sand)',
  lining: 'var(--sand)',
  'thermal breaks and weather barriers': 'var(--brand)',
}

export default function ManufacturerPage({ params }: { params: Promise<{ manufacturer: string }> }) {
  const { manufacturer: slug } = use(params)

  const [mfr, setMfr] = useState<Manufacturer | null>(null)
  const [allSystems, setAllSystems] = useState<SystemRow[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [showRequest, setShowRequest] = useState(false)
  const [requestText, setRequestText] = useState('')
  const [requestEmail, setRequestEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  const draft =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('draft')
      : null

  function withDraft(path: string) {
    return draft ? `${path}?draft=${encodeURIComponent(draft)}` : path
  }

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: manufacturer, error: manufacturerError } = await supabase
        .from('manufacturers')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()

      if (manufacturerError || !manufacturer) {
        setMfr(null)
        setAllSystems([])
        setLoading(false)
        return
      }

      const { data: systems, error: systemsError } = await supabase
        .from('systems')
        .select('id, name, slug, description, category, sort_order, verification_status, source_label, source_url')
        .eq('manufacturer_id', manufacturer.id)
        .order('sort_order', { ascending: true })

      setMfr(manufacturer)
      setAllSystems(systemsError || !systems ? [] : systems)
      setLoading(false)
    }

    load()
  }, [slug])

  const filtered = useMemo(() => {
    if (!query.trim()) return allSystems

    const q = query.toLowerCase()

    return allSystems.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    )
  }, [allSystems, query])

  if (loading) {
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

        <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <p className="text-sm text-text-secondary">Loading manufacturer…</p>
        </main>
      </div>
    )
  }

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
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand">{mfr.category || 'Manufacturer'}</p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-none md:text-6xl">{mfr.name}</h1>
          {mfr.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
              {mfr.description}
            </p>
          )}

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
                {filtered.map((sys) => (
                  <a
                    key={sys.id}
                    href={withDraft(`/manufacturers/${mfr.slug}/${sys.slug}`)}
                    className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand hover:bg-surface-hover"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
                        style={{
                          color: CATEGORY_COLOURS[(sys.category || '').toLowerCase()] || 'var(--brand)',
                          borderColor: CATEGORY_COLOURS[(sys.category || '').toLowerCase()] || 'var(--brand)',
                        }}
                      >
                        {sys.category || 'system'}
                      </span>

                      <div className="text-right">
                        {sys.verification_status && (
                          <span className="text-[11px] uppercase tracking-[0.16em] text-text-faint">
                            {sys.verification_status}
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="mt-4 text-2xl font-bold uppercase leading-tight text-text-primary">
                      {sys.name}
                    </h2>

                    {sys.description && (
                      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{sys.description}</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {sys.source_label && (
                        <span className="rounded-full border border-border bg-ui px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                          {sys.source_label}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl">
                  <p className="text-base font-semibold text-text-primary">
                    No systems listed yet.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    Need something specific from this manufacturer? Send a quick request and BuildQuote will look into adding it.
                  </p>
                </div>

                <button
                  onClick={() => setShowRequest(true)}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-brand bg-brand-subtle px-4 py-3 text-sm font-semibold text-brand transition-colors hover:border-brand-hover hover:text-brand-hover sm:w-auto"
                >
                  Request a system
                </button>
              </div>
            </div>
          )}
        </section>

        {showRequest && (
          <section className="mt-5 max-w-xl rounded-2xl border border-border bg-surface p-4 sm:p-5">
            {requestSent ? (
              <p className="text-sm text-text-secondary">Thanks for helping improve the BuildQuote product library. We will review your request and look at adding it.</p>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-primary">
                    What system should we add?
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-border bg-ui px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="Paste a link to the system you use regularly, or tell us the product name and manufacturer page."
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-primary">
                    Email
                  </label>
                  <input
                    className="w-full rounded-xl border border-border bg-ui px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-xl border border-brand bg-brand-subtle px-4 py-3 text-sm font-semibold text-brand transition-colors hover:border-brand-hover hover:text-brand-hover"
                  >
                    Send request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequest(false)}
                    className="rounded-xl border border-border bg-ui px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
