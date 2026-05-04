'use client'

import { useEffect, useMemo, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Manufacturer = {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
}

type SystemColour = {
  colour_name: string
  is_stocked: boolean
  sort_order: number
}

type SystemComponent = {
  role: string
  notes: string | null
  sort_order: number
  components: { name: string; sku: string | null } | null
}

type SystemRow = {
  id: string
  name: string
  slug: string
  product_code: string | null
  description?: string | null
  category?: string | null
  subcategory?: string | null
  dimensions?: string | null
  length_m?: number | null
  double_sided?: boolean
  hero_image_url?: string | null
  website_url?: string | null
  sort_order?: number | null
  verification_status?: string | null
  verified_by?: string | null
  source_label?: string | null
  source_url?: string | null
  system_colours: SystemColour[]
  system_components: SystemComponent[]
}

// ── Visual helpers ─────────────────────────────────────────────────────────────

const COLOUR_MAP: Record<string, string> = {
  'Antique': '#9B7B5A', 'Teak': '#7D5A3C', 'Walnut': '#5C3D2E',
  'Blackbutt': '#C4A882', 'Ipe': '#6B4226', 'Silver Grey': '#A8A9AD',
  'Beech': '#D4B896', 'Aged Wood': '#8B7355', 'Canadian Cedar': '#A0522D',
  'Ebony': '#2C2C2C', 'Ebony (Charred)': '#1A1A1A', 'Sea Salt': '#D8DCD8',
  'White': '#F5F5F5', 'Black': '#1A1A1A', 'Grey': '#9E9E9E',
  'Cream': '#F5F0E8', 'Charcoal': '#3C3C3C', 'Natural': '#C4A882',
  'Monument': '#4A4A4A', 'Paperbark': '#C8B89A', 'Surfmist': '#E8E4DC',
  'Dune': '#C4A97A', 'Woodland Grey': '#6B6B5A', 'Basalt': '#5A5A5A',
  'Evening Haze': '#9A9A8A', 'Shale Grey': '#8A8A7A',
}

const CATEGORY_BG: Record<string, string> = {
  'Decking': '#d1fae5',
  'Cladding': '#dbeafe',
  'Screening & Fencing': '#fef3c7',
  'Exterior Cladding': '#dbeafe',
  'Interior Lining': '#ede9fe',
  'Weatherboard': '#dbeafe',
  'Flooring': '#d1fae5',
  'Trim': '#fef3c7',
  'Eaves': '#fef3c7',
  'Lining': '#ede9fe',
}
const CATEGORY_TEXT: Record<string, string> = {
  'Decking': '#065f46',
  'Cladding': '#1e40af',
  'Screening & Fencing': '#92400e',
  'Exterior Cladding': '#1e40af',
  'Interior Lining': '#5b21b6',
  'Weatherboard': '#1e40af',
  'Flooring': '#065f46',
  'Trim': '#92400e',
  'Eaves': '#92400e',
  'Lining': '#5b21b6',
}

// ── Public system card (widget-style, no verification panel) ───────────────────

function PublicSystemCard({
  system,
  href,
}: {
  system: SystemRow
  href: string
}) {
  const catBg   = CATEGORY_BG[system.category || '']   || '#f3f4f6'
  const catText = CATEGORY_TEXT[system.category || ''] || '#374151'
  const stocked    = system.system_colours.filter((c) => c.is_stocked)
  const required   = system.system_components.filter((c) => c.role === 'required'    && c.components)
  const recommended = system.system_components.filter((c) => c.role === 'recommended' && c.components)

  return (
    <a
      href={href}
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = 'var(--brand, #1b3a2d)'
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = '#e5e7eb'
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      {/* Hero image */}
      <div
        style={{
          height: '160px',
          background: system.hero_image_url
            ? `url(${system.hero_image_url}) center/cover no-repeat`
            : '#f3f4f6',
          position: 'relative',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!system.hero_image_url && (
          <span
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#d1d5db',
              fontFamily: 'monospace',
            }}
          >
            {system.product_code || system.name.slice(0, 6).toUpperCase()}
          </span>
        )}

        {/* Category badge */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: catBg,
            color: catText,
            padding: '3px 8px',
            borderRadius: '20px',
          }}
        >
          {system.category || 'System'}
        </span>

        {system.double_sided && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '10px',
              fontWeight: 600,
              background: '#fff',
              color: '#374151',
              padding: '3px 8px',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
            }}
          >
            Double sided
          </span>
        )}

        {/* Verified badge */}
        {system.verified_by && (
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              fontSize: '10px',
              fontWeight: 700,
              background: '#d1fae5',
              color: '#065f46',
              padding: '3px 8px',
              borderRadius: '20px',
            }}
          >
            ✓ Verified
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Name + code */}
        <div style={{ marginBottom: '4px' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.2,
            }}
          >
            {system.name}
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
              flexWrap: 'wrap',
            }}
          >
            {system.product_code && (
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: '#6b7280',
                  background: '#f3f4f6',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {system.product_code}
              </span>
            )}
            {system.dimensions && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {system.dimensions}
                {system.length_m ? ` · ${system.length_m}m` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {system.description && (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {system.description}
          </p>
        )}

        {/* Colours */}
        {stocked.length > 0 && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid #f3f4f6',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9ca3af',
                marginBottom: '6px',
              }}
            >
              Available Colours
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {stocked.map((c) => (
                <span
                  key={c.colour_name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    color: '#6b7280',
                    background: '#f3f4f6',
                    borderRadius: '20px',
                    padding: '3px 8px 3px 5px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: COLOUR_MAP[c.colour_name] || '#888',
                      border: '1px solid rgba(0,0,0,0.15)',
                    }}
                  />
                  {c.colour_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Components */}
        {(required.length > 0 || recommended.length > 0) && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid #f3f4f6',
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9ca3af',
                marginBottom: '8px',
              }}
            >
              Fixings &amp; Components
            </div>
            {[
              { items: required, role: 'Required' },
              { items: recommended, role: 'Recommended' },
            ].map(({ items, role }) =>
              items.length === 0 ? null : (
                <div key={role} style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: role === 'Required' ? '#374151' : '#9ca3af',
                      marginBottom: '5px',
                    }}
                  >
                    {role}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '6px 10px',
                          background: role === 'Required' ? '#f9fafb' : '#fafafa',
                          border: `1px solid ${role === 'Required' ? '#e5e7eb' : '#f3f4f6'}`,
                          borderRadius: '6px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}
                          >
                            {item.components!.name}
                          </span>
                          {item.components!.sku && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                color: '#6b7280',
                                background: '#f3f4f6',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                            >
                              {item.components!.sku}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                            {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Source label */}
        {system.source_label && (
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '12px' }}>📄</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{system.source_label}</span>
          </div>
        )}

        {/* View details arrow */}
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
            View details ↗
          </span>
        </div>
      </div>
    </a>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ManufacturerPage({
  params,
}: {
  params: Promise<{ manufacturer: string }>
}) {
  const { manufacturer: slug } = use(params)

  const [mfr, setMfr] = useState<Manufacturer | null>(null)
  const [allSystems, setAllSystems] = useState<SystemRow[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [showRequest, setShowRequest] = useState(false)
  const [requestText, setRequestText] = useState('')
  const [requestEmail, setRequestEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  const searchParams = useSearchParams()
  const draft = searchParams.get('draft')

  function withDraft(path: string) {
    return draft ? `${path}?draft=${encodeURIComponent(draft)}` : path
  }

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: manufacturer, error: manufacturerError } = await supabase
        .from('manufacturers')
        .select('id, name, slug, description, logo_url, website_url')
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
        .select(`
          id, name, slug, product_code, description, category, subcategory,
          dimensions, length_m, double_sided, hero_image_url, website_url,
          sort_order, verification_status, verified_by, source_label, source_url,
          system_colours(colour_name, is_stocked, sort_order),
          system_components(role, notes, sort_order, components(name, sku))
        `)
        .eq('manufacturer_id', manufacturer.id)
        .order('sort_order', { ascending: true })

      setMfr(manufacturer)
      setAllSystems(
        systemsError || !systems
          ? []
          : (systems.map((s) => ({
              ...s,
              system_colours: (s.system_colours || []).sort(
                (a: SystemColour, b: SystemColour) => a.sort_order - b.sort_order
              ),
              system_components: (s.system_components || []).sort(
                (a: SystemComponent, b: SystemComponent) => a.sort_order - b.sort_order
              ),
            })) as unknown as SystemRow[]))
      )
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
        s.description?.toLowerCase().includes(q) ||
        s.product_code?.toLowerCase().includes(q)
    )
  }, [allSystems, query])

  // ── Loading ──────────────────────────────────────────────────────────────────

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

  // ── 404 ──────────────────────────────────────────────────────────────────────

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

  // ── Page ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-page text-text-primary">
      <nav className="sticky top-0 z-30 border-b border-border bg-page/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <a
            href={withDraft('/manufacturers')}
            className="text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-brand"
          >
            ← Manufacturers
          </a>
          <a href={withDraft('/')} className="text-sm font-bold tracking-[0.2em]">
            BUILD<span className="text-brand">QUOTE</span>
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {/* Manufacturer header */}
        <section className="max-w-3xl">
          <div className="flex items-start gap-4">
            {mfr.logo_url && (
              <img
                src={mfr.logo_url}
                alt={mfr.name}
                className="w-16 h-16 object-contain flex-shrink-0 mt-1"
              />
            )}
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
                Manufacturer
              </p>
              <h1 className="mt-2 text-4xl font-bold uppercase leading-none md:text-6xl">
                {mfr.name}
              </h1>
            </div>
          </div>

          {mfr.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
              {mfr.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {mfr.website_url && (
              <a
                href={mfr.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl border border-brand bg-brand-subtle px-4 py-3 text-sm font-semibold text-brand transition-colors hover:border-brand-hover hover:text-brand-hover"
              >
                Visit Website ↗
              </a>
            )}
          </div>

          <div className="mt-6 max-w-3xl rounded-2xl border border-sand/35 bg-sand/5 p-4">
            <div className="flex gap-3">
              <span className="pt-0.5 text-sand">⚠</span>
              <p className="text-sm leading-relaxed text-text-secondary">
                Component cards are compiled using AI and publicly available manufacturer data.
                Always verify product codes, specifications and compatibility on the
                manufacturer&apos;s website before placing your order.
              </p>
            </div>
          </div>
        </section>

        {/* Systems section */}
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
                  <PublicSystemCard
                    key={sys.id}
                    system={sys}
                    href={withDraft(`/manufacturers/${mfr.slug}/${sys.slug}`)}
                  />
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
                    Need something specific from this manufacturer? Send a quick request and
                    BuildQuote will look into adding it.
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

        {/* Request form */}
        {showRequest && (
          <section className="mt-5 max-w-xl rounded-2xl border border-border bg-surface p-4 sm:p-5">
            {requestSent ? (
              <p className="text-sm text-text-secondary">
                Thanks for helping improve the BuildQuote product library. We will review your
                request and look at adding it.
              </p>
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
