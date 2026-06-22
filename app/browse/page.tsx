'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type Component = {
  id: string
  sku: string | null
  name: string
  description: string | null
  category: string | null
  uom: string | null
}

type SystemComponent = {
  role: string
  notes: string | null
  sort_order: number
  components: Component | null
}

type System = {
  id: string
  name: string
  product_code: string
  slug: string
  category: string
  subcategory: string | null
  description: string | null
  hero_image_url: string | null
  system_components: SystemComponent[]
}

type Manufacturer = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  systems: System[]
}

type View = 'manufacturers' | 'systems' | 'components'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
      ✓ {message}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function BrowsePageInner() {
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draft')

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading]             = useState(true)
  const [view, setView]                   = useState<View>('manufacturers')
  const [selectedMf, setSelectedMf]       = useState<Manufacturer | null>(null)
  const [selectedSys, setSelectedSys]     = useState<System | null>(null)
  const [adding, setAdding]               = useState<string | null>(null)
  const [toast, setToast]                 = useState<string | null>(null)
  const [addedIds, setAddedIds]           = useState<Set<string>>(new Set())

  useEffect(() => { loadCatalogue() }, [])

  async function loadCatalogue() {
    const { data, error } = await supabase
      .from('manufacturers')
      .select(`
        id, name, slug, description, logo_url,
        systems (
          id, name, product_code, slug, category, subcategory, description, hero_image_url,
          system_components (
            role, notes, sort_order,
            components ( id, sku, name, description, category, uom )
          )
        )
      `)
      .order('name')

    if (error) { console.error(error); setLoading(false); return }
    const mfrs = (data as unknown as Manufacturer[]).filter(m => m.systems.length > 0)
    setManufacturers(mfrs)
    setLoading(false)
  }

  const addToRFQ = useCallback(async (component: Component, system: System, manufacturer: Manufacturer) => {
    if (!draftId) return
    setAdding(component.id)
    try {
      const res = await fetch('/api/add-to-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          items: [{
            name: component.name,
            sku: component.sku || '',
            desc: [component.description, system.name, manufacturer.name].filter(Boolean).join(' · '),
            uom: component.uom || 'EA',
            qty: '1',
          }],
        }),
      })
      if (res.ok) {
        setAddedIds(prev => new Set([...prev, component.id]))
        setToast(`${component.name} added to quote`)
      } else {
        setToast('Failed to add — try again')
      }
    } catch {
      setToast('Failed to add — try again')
    }
    setAdding(null)
  }, [draftId])

  // ── No draft ID ───────────────────────────────────────────────────────────

  if (!draftId) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-text-primary font-semibold mb-2">No quote linked</p>
        <p className="text-text-faint text-sm">
          Open this page from the BuildQuote &ldquo;Enter Items&rdquo; step using the
          &ldquo;Add from manufacturer portal&rdquo; button.
        </p>
      </div>
    </div>
  )

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <p className="text-text-faint text-sm animate-pulse">Loading catalogue…</p>
    </div>
  )

  // ── Empty DB ──────────────────────────────────────────────────────────────

  if (manufacturers.length === 0) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-text-primary font-semibold mb-2">Catalogue coming soon</p>
        <p className="text-text-faint text-sm">No products are listed yet. Check back soon.</p>
      </div>
    </div>
  )

  // ── Breadcrumb ────────────────────────────────────────────────────────────

  function Breadcrumb() {
    return (
      <div className="flex items-center gap-2 text-sm text-text-faint mb-6">
        <button onClick={() => { setView('manufacturers'); setSelectedMf(null); setSelectedSys(null) }}
          className={view === 'manufacturers' ? 'text-text-primary font-medium' : 'hover:text-text-primary'}>
          Manufacturers
        </button>
        {selectedMf && (
          <>
            <span>›</span>
            <button onClick={() => { setView('systems'); setSelectedSys(null) }}
              className={view === 'systems' ? 'text-text-primary font-medium' : 'hover:text-text-primary'}>
              {selectedMf.name}
            </button>
          </>
        )}
        {selectedSys && (
          <>
            <span>›</span>
            <span className="text-text-primary font-medium">{selectedSys.name}</span>
          </>
        )}
      </div>
    )
  }

  // ── Header ────────────────────────────────────────────────────────────────

  const buildquoteUrl = process.env.NEXT_PUBLIC_BUILDQUOTE_URL ?? 'https://buildquote.com.au'

  return (
    <div className="min-h-screen bg-page">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-[1480px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <span className="text-text-faint text-xs hidden sm:block">Product catalogue</span>
          </div>
          <div className="flex items-center gap-3">
            {addedIds.size > 0 && (
              <span className="text-xs text-brand font-medium">
                {addedIds.size} item{addedIds.size !== 1 ? 's' : ''} added
              </span>
            )}
            <a
              href={`${buildquoteUrl}/rfq?draft=${draftId}`}
              target="_parent"
              className="text-xs px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold transition-colors"
            >
              Return to quote →
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-[1480px] mx-auto px-6 py-8">
        <Breadcrumb />

        {/* ── Manufacturer grid ───────────────────────────────────────────── */}
        {view === 'manufacturers' && (
          <div>
            <h1 className="text-xl font-bold text-text-primary mb-6">Choose a manufacturer</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {manufacturers.map(mf => (
                <button key={mf.id}
                  onClick={() => { setSelectedMf(mf); setView('systems') }}
                  className="text-left p-5 bg-surface border border-border rounded-xl hover:border-brand transition-colors group">
                  {mf.logo_url && (
                    <img src={mf.logo_url} alt={mf.name}
                      className="h-8 object-contain mb-3"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <p className="font-semibold text-text-primary group-hover:text-brand transition-colors">{mf.name}</p>
                  {mf.description && (
                    <p className="text-text-faint text-xs mt-1 line-clamp-2">{mf.description}</p>
                  )}
                  <p className="text-brand text-xs mt-3 font-medium">{mf.systems.length} system{mf.systems.length !== 1 ? 's' : ''} →</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── System list ─────────────────────────────────────────────────── */}
        {view === 'systems' && selectedMf && (
          <div>
            <h1 className="text-xl font-bold text-text-primary mb-2">{selectedMf.name}</h1>
            <p className="text-text-faint text-sm mb-6">Select a product system to view components</p>

            {/* Group by category */}
            {Array.from(new Set(selectedMf.systems.map(s => s.category))).map(cat => (
              <div key={cat} className="mb-8">
                <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-3">{cat}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMf.systems.filter(s => s.category === cat).map(sys => (
                    <button key={sys.id}
                      onClick={() => { setSelectedSys(sys); setView('components') }}
                      className="text-left p-4 bg-surface border border-border rounded-xl hover:border-brand transition-colors group">
                      <span className="font-mono text-xs text-text-faint block mb-1">{sys.product_code}</span>
                      <p className="font-semibold text-text-primary text-sm group-hover:text-brand transition-colors">{sys.name}</p>
                      {sys.subcategory && <p className="text-text-faint text-xs mt-0.5">{sys.subcategory}</p>}
                      {sys.description && <p className="text-text-faint text-xs mt-2 line-clamp-2">{sys.description}</p>}
                      <p className="text-brand text-xs mt-3 font-medium">
                        {sys.system_components.length} component{sys.system_components.length !== 1 ? 's' : ''} →
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Component list ──────────────────────────────────────────────── */}
        {view === 'components' && selectedSys && selectedMf && (
          <div>
            <div className="mb-6">
              <span className="font-mono text-xs text-text-faint">{selectedSys.product_code}</span>
              <h1 className="text-xl font-bold text-text-primary mt-1">{selectedSys.name}</h1>
              {selectedSys.description && (
                <p className="text-text-faint text-sm mt-2">{selectedSys.description}</p>
              )}
            </div>

            {selectedSys.system_components.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-8 text-center">
                <p className="text-text-faint text-sm">No components listed for this system yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedSys.system_components
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(sc => {
                    const comp = sc.components
                    if (!comp) return null
                    const isAdded = addedIds.has(comp.id)
                    const isAdding = adding === comp.id
                    return (
                      <div key={comp.id}
                        className="flex items-start justify-between gap-4 bg-surface border border-border rounded-xl px-5 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {comp.sku && (
                              <span className="font-mono text-xs text-text-faint bg-ui px-2 py-0.5 rounded">{comp.sku}</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              sc.role === 'required' ? 'bg-brand/10 text-brand' : 'bg-ui text-text-faint'
                            }`}>
                              {sc.role}
                            </span>
                          </div>
                          <p className="font-semibold text-text-primary text-sm mt-1.5">{comp.name}</p>
                          {comp.description && (
                            <p className="text-text-faint text-xs mt-1 leading-relaxed">{comp.description}</p>
                          )}
                          {sc.notes && (
                            <p className="text-text-faint text-xs mt-1 italic">{sc.notes}</p>
                          )}
                          {comp.uom && (
                            <p className="text-text-faint text-xs mt-1">Unit: {comp.uom}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {!draftId ? (
                            <span className="text-xs text-text-faint">No quote linked</span>
                          ) : isAdded ? (
                            <span className="text-xs text-brand font-medium px-3 py-1.5 bg-brand/10 rounded-lg">✓ Added</span>
                          ) : (
                            <button
                              onClick={() => addToRFQ(comp, selectedSys, selectedMf)}
                              disabled={isAdding}
                              className="text-xs px-3 py-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                            >
                              {isAdding ? 'Adding…' : '+ Add to quote'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading…</div>}>
      <BrowsePageInner />
    </Suspense>
  )
}
