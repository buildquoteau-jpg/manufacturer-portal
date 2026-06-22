'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { ManufacturerListItem } from '@/lib/data/getManufacturers'
import { SystemCardTile } from '@/components/ui/SystemCardTile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUILDQUOTE_URL = process.env.NEXT_PUBLIC_BUILDQUOTE_URL || 'https://buildquote.com.au'

// ── Types ─────────────────────────────────────────────────────────────────────

type SystemResult = {
  id: string
  name: string
  product_code: string
  slug: string | null
  category: string
  subcategory: string | null
  description: string | null
  dimensions: string | null
  hero_image_url: string | null
  australian_made: boolean | null
  notes: string | null
  manufacturers: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
  system_profiles: { id: string }[]
  system_components: { components: unknown | null }[]
}

// ── Search ────────────────────────────────────────────────────────────────────

function fuzzySearch(items: SystemResult[], query: string): SystemResult[] {
  const q = query.trim()
  if (q.length < 2) return []
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  return items.filter(item => {
    const mfr = item.manufacturers as any
    const hay = [
      item.name, item.product_code, item.category,
      item.subcategory ?? '', mfr?.name ?? '',
      item.description ?? '', item.dimensions ?? '',
      item.notes ?? '',
    ].join(' ').toLowerCase()
    return terms.every(t => hay.includes(t))
  })
}

// ── Main component ────────────────────────────────────────────────────────────

const EXAMPLES = [
  '820 internal door', 'fibre cement cladding', 'composite decking', 'external corner trim',
]

export function ManufacturersClient({
  manufacturers, draft,
}: {
  manufacturers: ManufacturerListItem[]
  draft: string | undefined
}) {
  const [query, setQuery]                   = useState('')
  const [mfrFilter, setMfrFilter]           = useState('')
  const [allSystems, setAllSystems]         = useState<SystemResult[]>([])
  const [systemsLoading, setSystemsLoading] = useState(false)
  const [systemsLoaded, setSystemsLoaded]   = useState(false)

  const inputRef   = useRef<HTMLInputElement>(null)
  const draftParam = draft ? `?draft=${draft}` : ''
  const returnHref = draft ? `${BUILDQUOTE_URL}/rfq?draft=${draft}` : null

  // Load all systems once on first keystroke
  const loadSystems = useCallback(async () => {
    if (systemsLoaded || systemsLoading) return
    setSystemsLoading(true)
    const { data } = await supabase
      .from('systems')
      .select(`
        id, name, product_code, slug, category, subcategory, description,
        dimensions, hero_image_url, australian_made, notes,
        manufacturers ( id, name, slug, logo_url ),
        system_profiles ( id ),
        system_components ( id, components ( id ) )
      `)
      .order('name')
    setAllSystems((data as unknown as SystemResult[]) ?? [])
    setSystemsLoaded(true)
    setSystemsLoading(false)
  }, [systemsLoaded, systemsLoading])

  useEffect(() => {
    if (query.length >= 2) loadSystems()
  }, [query, loadSystems])

  const results = useMemo(() => fuzzySearch(allSystems, query), [allSystems, query])

  return (
    <>
      {/* ── Hero / Search ──────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(140deg, #185D7A 0%, #0f4461 100%)', padding: '52px 20px 44px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>

          {draft ? (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Quote Mode Active
              </p>
              <h1 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Add products to your RFQ
              </h1>
              <p style={{ margin: '0 0 16px', fontSize: '15px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                Search for a product or browse by manufacturer below.
              </p>
              <a
                href={returnHref!}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.8)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)' }}
              >
                ← Exit product browse — return to RFQ
              </a>
            </div>
          ) : (
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ margin: '0 0 12px', fontSize: '34px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                Find Building Products &amp; Suppliers
              </h1>
              <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                Browse manufacturer product systems and find local WA suppliers — in seconds.
              </p>
            </div>
          )}

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#94a3b8" strokeWidth="2"/>
                <path d="M13 13l3 3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search products, systems, manufacturers…"
              style={{ width: '100%', boxSizing: 'border-box', border: '0', borderRadius: '16px', padding: '18px 52px', fontSize: '16px', color: '#0f172a', background: '#ffffff', outline: 'none', boxShadow: '0 6px 32px rgba(0,0,0,0.22)', fontWeight: 500 }}
            />
            {query && (
              <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#9ca3af', lineHeight: 1, padding: '4px' }}>
                ×
              </button>
            )}
          </div>

          {/* Example chips */}
          {!query && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>Try:</span>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setQuery(ex); loadSystems() }}
                  style={{ fontSize: '13px', padding: '6px 14px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '99px', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.24)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)' }}>
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────────────── */}
      <div style={{ background: '#f8fafc', minHeight: '60vh' }}>
        <div className="mfp-catalogue-wrap px-4 sm:px-5 pb-28">

          {systemsLoading && <p style={{ fontSize: '14px', color: '#9ca3af', paddingTop: '32px' }}>Loading products…</p>}

          {/* Search results — tiles navigate to the manufacturer page */}
          {query.length >= 2 && !systemsLoading && systemsLoaded && (
            <div style={{ marginBottom: '56px', paddingTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Product matches</h2>
                {results.length > 0 && (
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {results.length} result{results.length !== 1 ? 's' : ''} across {new Set(results.map(r => (r.manufacturers as any)?.id)).size} manufacturer{new Set(results.map(r => (r.manufacturers as any)?.id)).size !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {results.length > 0 ? (
                <>
                  <style>{`
                    .search-results-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                    @media (min-width: 680px) { .search-results-grid { grid-template-columns: repeat(2, 1fr); } }
                    @media (min-width: 1060px) { .search-results-grid { grid-template-columns: repeat(3, 1fr); } }
                  `}</style>
                  <div className="search-results-grid">
                    {results.map(system => {
                      const mfr = system.manufacturers as any
                      const href = mfr?.slug ? `/manufacturers/${mfr.slug}${draftParam}` : null
                      return (
                        <SystemCardTile
                          key={system.id}
                          system={system}
                          manufacturer={mfr}
                          onClick={() => { if (href) window.location.href = href }}
                        />
                      )
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px 24px', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#ffffff' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#374151' }}>No matches for &ldquo;{query}&rdquo;</p>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>Try different keywords — e.g. shorten your search, use a category name, or a product code.</p>
                  <button
                    onClick={() => { setQuery(''); inputRef.current?.focus() }}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#185D7A', background: 'none', border: '1.5px solid #185D7A', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer' }}
                  >
                    Clear search and browse by manufacturer ↓
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingTop: query.length >= 2 ? '0' : '36px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {query.length >= 2 ? 'or browse by manufacturer' : 'Browse by manufacturer'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Manufacturer filter */}
          {manufacturers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative', maxWidth: '320px' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="#94a3b8" strokeWidth="2"/>
                    <path d="M13 13l3 3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={mfrFilter}
                  onChange={e => setMfrFilter(e.target.value)}
                  placeholder="Filter manufacturers by name…"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '10px 36px 10px 34px', fontSize: '14px', color: '#0f172a', background: '#ffffff', outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#185D7A' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }}
                />
                {mfrFilter && (
                  <button onClick={() => setMfrFilter('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '2px' }}>
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Manufacturer grid */}
          {manufacturers.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '15px' }}>No manufacturers listed yet.</p>
          ) : (
            <>
              <style>{`
                .mfr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
                @media (min-width: 640px) { .mfr-grid { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 900px) { .mfr-grid { grid-template-columns: repeat(4, 1fr); } }
                .mfr-card { background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: box-shadow 0.15s, border-color 0.15s; }
                .mfr-card:hover { box-shadow: 0 6px 24px rgba(24,93,122,0.13); border-color: #185D7A; }
              `}</style>
              {manufacturers.filter(m => !mfrFilter.trim() || m.name.toLowerCase().includes(mfrFilter.trim().toLowerCase())).length === 0 && mfrFilter.trim() ? (
                <div style={{ padding: '32px 24px', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#ffffff' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151' }}>No manufacturers match &ldquo;{mfrFilter}&rdquo;</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Try a shorter or different name.</p>
                </div>
              ) : (
              <div className="mfr-grid">
                {manufacturers.filter(m => !mfrFilter.trim() || m.name.toLowerCase().includes(mfrFilter.trim().toLowerCase())).map(m => (
                  <a key={m.id} href={`/manufacturers/${m.slug}${draftParam}`} className="mfr-card">
                    <div style={{ height: '160px', flexShrink: 0, ...(m.hero_image_url ? { backgroundImage: `url(${m.hero_image_url})`, backgroundSize: 'cover', backgroundPosition: `center ${m.hero_image_position_y ?? 50}%` } : { background: '#f0f4f8' }), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!m.hero_image_url && (
                        m.logo_url
                          ? <img src={m.logo_url} alt={m.name} style={{ maxWidth: '75%', maxHeight: '65%', objectFit: 'contain' }} />
                          : <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.02em', textAlign: 'center', padding: '0 12px' }}>{m.name}</span>
                      )}
                    </div>
                    <div style={{ padding: '12px 14px 14px', flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: '4px' }}>{m.name}</div>
                      {m.description && (
                        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{m.description}</div>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#185D7A' }}>{m.system_count} product{m.system_count !== 1 ? 's' : ''}</div>
                    </div>
                  </a>
                ))}
              </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
