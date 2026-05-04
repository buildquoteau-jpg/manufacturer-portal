'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

type ManufacturerData = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  website_url: string | null
  description: string | null
  abn: string | null
  phone: string | null
  auth_user_id: string | null
  created_at: string
}

type System = {
  id: string
  name: string
  product_code: string
  category: string
  subcategory: string | null
  description: string | null
  sort_order: number
  source_document_id: string | null
  verified_by: string | null
  verified_at: string | null
  change_notes: string | null
}

type CatalogueSource = {
  id: string
  document_name: string
  document_url: string | null
  document_date: string | null
  extracted_at: string
  notes: string | null
}

type Contact = {
  id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  sort_order: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-border-subtle last:border-0">
      <span className="text-text-faint text-sm w-36 flex-shrink-0">{label}</span>
      <span className="text-text-primary text-sm">{value}</span>
    </div>
  )
}

// ── Verification panel inside a system card ───────────────────────────────────

function VerificationPanel({
  system,
  accessToken,
  onUpdate,
}: {
  system: System
  accessToken: string
  onUpdate: (updated: Partial<System>) => void
}) {
  const [mode, setMode]         = useState<'idle' | 'form' | 'saving'>('idle')
  const [name, setName]         = useState('')
  const [notes, setNotes]       = useState(system.change_notes || '')
  const [error, setError]       = useState('')
  const [removing, setRemoving] = useState(false)

  const isVerified = !!system.verified_by

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    setMode('saving')
    setError('')
    const res = await fetch('/api/manufacturer/verify-system', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ systemId: system.id, verifiedBy: name, changeNotes: notes }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed to save'); setMode('form'); return }
    onUpdate({
      verified_by:  json.system.verified_by,
      verified_at:  json.system.verified_at,
      change_notes: json.system.change_notes,
    })
    setMode('idle')
  }

  async function handleRemove() {
    setRemoving(true)
    const res = await fetch('/api/manufacturer/verify-system', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ systemId: system.id }),
    })
    const json = await res.json()
    if (!res.ok) { setRemoving(false); return }
    onUpdate({
      verified_by:  json.system.verified_by,
      verified_at:  json.system.verified_at,
      change_notes: json.system.change_notes,
    })
    setRemoving(false)
  }

  // ── Verified state ────────────────────────────────────────────────────────
  if (isVerified) {
    return (
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-success text-sm">✓</span>
              <span className="text-success text-sm font-semibold">Verified</span>
            </div>
            <p className="text-text-faint text-xs">
              <span className="font-medium text-text-secondary">{system.verified_by}</span>
              {system.verified_at && (
                <span> · {formatDate(system.verified_at)}</span>
              )}
            </p>
            {system.change_notes && (
              <p className="text-xs mt-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg px-3 py-2 leading-relaxed">
                <span className="font-semibold block mb-0.5">Changes needed:</span>
                {system.change_notes}
              </p>
            )}
          </div>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-xs text-text-faint hover:text-error transition-colors flex-shrink-0 disabled:opacity-50"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    )
  }

  // ── Unverified — idle ─────────────────────────────────────────────────────
  if (mode === 'idle') {
    return (
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <button
          onClick={() => setMode('form')}
          className="flex items-center gap-2 text-sm text-text-faint hover:text-text-primary transition-colors group"
        >
          <span className="w-5 h-5 rounded-full border border-border-subtle group-hover:border-brand flex items-center justify-center transition-colors text-xs">✓</span>
          <span>Verify this card</span>
        </button>
      </div>
    )
  }

  // ── Unverified — form ─────────────────────────────────────────────────────
  return (
    <div className="mt-4 pt-4 border-t border-border-subtle">
      <form onSubmit={handleVerify} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Verified by</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="w-full bg-page border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Changes needed <span className="text-text-faint font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Update colour options — Ash discontinued. Add new product code EC-140."
            rows={2}
            className="w-full bg-page border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:outline-none focus:border-brand transition-colors resize-none"
          />
        </div>
        {error && <p className="text-error text-xs">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={mode === 'saving'}
            className="px-4 py-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {mode === 'saving' ? 'Saving…' : 'Confirm verification'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('idle'); setError('') }}
            className="text-xs text-text-faint hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ── System Card ───────────────────────────────────────────────────────────────

function SystemCard({
  system,
  source,
  accessToken,
  onUpdate,
}: {
  system: System
  source: CatalogueSource | undefined
  accessToken: string
  onUpdate: (id: string, updated: Partial<System>) => void
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col">
      {/* Category */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-brand border border-brand/30 bg-brand-subtle rounded-full px-2.5 py-0.5">
          {system.category}
        </span>
        {system.verified_by && (
          <span className="text-[10px] text-success font-medium tracking-wide">✓ Verified</span>
        )}
      </div>

      {/* Product code + name */}
      <p className="text-[11px] font-mono text-text-faint mb-1">{system.product_code}</p>
      <h3 className="text-xl font-bold text-text-primary leading-tight">{system.name}</h3>
      {system.subcategory && (
        <p className="text-text-faint text-sm mt-0.5">— {system.subcategory}</p>
      )}

      {/* Description */}
      {system.description && (
        <p className="text-text-secondary text-sm mt-3 leading-relaxed">{system.description}</p>
      )}

      {/* Source */}
      {source && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-text-faint text-xs">📄</span>
          <span className="text-text-faint text-xs truncate" title={source.document_name}>
            {source.document_name}
            {source.document_date && ` · ${source.document_date}`}
          </span>
        </div>
      )}

      {/* Push verification to bottom */}
      <div className="flex-1" />

      <VerificationPanel
        system={system}
        accessToken={accessToken}
        onUpdate={updated => onUpdate(system.id, updated)}
      />
    </div>
  )
}

// ── Full-screen cards overlay ─────────────────────────────────────────────────

function CardsOverlay({
  manufacturer,
  systems,
  sources,
  accessToken,
  onClose,
  onUpdate,
}: {
  manufacturer: ManufacturerData
  systems: System[]
  sources: CatalogueSource[]
  accessToken: string
  onClose: () => void
  onUpdate: (id: string, updated: Partial<System>) => void
}) {
  const verified   = systems.filter(s => s.verified_by)
  const unverified = systems.filter(s => !s.verified_by)

  return (
    <div className="fixed inset-0 z-50 bg-page overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-text-primary font-bold">
              System cards
              <span className="ml-2 text-sm font-normal text-text-faint">
                {manufacturer.name} · {systems.length} card{systems.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <p className="text-text-faint text-xs mt-0.5">
              {verified.length} verified · {unverified.length} awaiting verification
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-faint hover:text-text-primary text-2xl leading-none px-2 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {systems.length === 0 ? (
          <p className="text-text-faint text-sm text-center py-12">No products loaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {systems.map(sys => (
              <SystemCard
                key={sys.id}
                system={sys}
                source={sources.find(s => s.id === sys.source_document_id)}
                accessToken={accessToken}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}

        {/* Verification summary */}
        {systems.length > 0 && (
          <div className="mt-10 bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Verification summary</h3>
            <div className="space-y-2">
              {systems.map(sys => (
                <div key={sys.id} className="flex items-center justify-between gap-4 py-1.5 border-b border-border-subtle last:border-0">
                  <span className="text-sm text-text-secondary">
                    <span className="font-mono text-xs text-text-faint mr-2">{sys.product_code}</span>
                    {sys.name}
                  </span>
                  {sys.verified_by ? (
                    <span className="text-xs text-success font-medium flex-shrink-0">
                      ✓ {sys.verified_by}
                    </span>
                  ) : (
                    <span className="text-xs text-text-faint flex-shrink-0">Unverified</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-text-faint text-xs mt-8">Powered by BuildQuote</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManufacturerPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [loading, setLoading]           = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [notFound, setNotFound]         = useState(false)
  const [manufacturer, setManufacturer] = useState<ManufacturerData | null>(null)
  const [systems, setSystems]           = useState<System[]>([])
  const [sources, setSources]           = useState<CatalogueSource[]>([])
  const [contacts, setContacts]         = useState<Contact[]>([])
  const [accessToken, setAccessToken]   = useState('')
  const [cardsOpen, setCardsOpen]       = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/manufacturer/login'
      return
    }
    setAccessToken(session.access_token)

    const { data: mf, error } = await supabase
      .from('manufacturers')
      .select('id, name, slug, logo_url, website_url, description, abn, phone, auth_user_id, created_at')
      .eq('slug', slug)
      .single()

    if (error || !mf) {
      setNotFound(true)
      setLoading(false)
      return
    }

    if (mf.auth_user_id !== session.user.id) {
      setUnauthorized(true)
      setLoading(false)
      return
    }

    setManufacturer(mf as ManufacturerData)

    const [{ data: systemsData }, { data: sourcesData }, { data: contactsData }] = await Promise.all([
      supabase
        .from('systems')
        .select('id, name, product_code, category, subcategory, description, sort_order, source_document_id, verified_by, verified_at, change_notes')
        .eq('manufacturer_id', mf.id)
        .order('sort_order'),
      supabase
        .from('catalogue_sources')
        .select('id, document_name, document_url, document_date, extracted_at, notes')
        .eq('manufacturer_id', mf.id)
        .order('extracted_at', { ascending: false }),
      supabase
        .from('portal_contacts')
        .select('id, name, role, email, phone, sort_order')
        .eq('entity_type', 'manufacturer')
        .eq('entity_id', mf.id)
        .order('sort_order'),
    ])

    if (systemsData)  setSystems(systemsData as System[])
    if (sourcesData)  setSources(sourcesData as CatalogueSource[])
    if (contactsData) setContacts(contactsData as Contact[])

    setLoading(false)
  }

  function handleSystemUpdate(id: string, updated: Partial<System>) {
    setSystems(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/manufacturer/login'
  }

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="text-text-faint text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <p className="text-text-faint text-sm">Manufacturer portal not found.</p>
          <Link href="/" className="text-brand text-xs hover:underline block">← Back to home</Link>
        </div>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-text-faint text-sm">You don't have access to this portal.</p>
          <button onClick={handleSignOut} className="text-brand text-xs hover:underline block mx-auto">
            Sign out and try another account
          </button>
        </div>
      </div>
    )
  }

  if (!manufacturer) return null

  // Group systems by category for the list view
  const byCategory = systems.reduce<Record<string, System[]>>((acc, sys) => {
    if (!acc[sys.category]) acc[sys.category] = []
    acc[sys.category].push(sys)
    return acc
  }, {})

  const verifiedCount = systems.filter(s => s.verified_by).length

  return (
    <>
      {/* Cards overlay */}
      {cardsOpen && (
        <CardsOverlay
          manufacturer={manufacturer}
          systems={systems}
          sources={sources}
          accessToken={accessToken}
          onClose={() => setCardsOpen(false)}
          onUpdate={handleSystemUpdate}
        />
      )}

      <div className="min-h-screen bg-page">

        {/* Nav */}
        <div className="sticky top-0 z-30 bg-surface border-b border-border px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-widest uppercase">
                <span style={{ color: '#185D7A' }}>Build</span><span style={{ color: '#f97316' }}>Quote</span>
              </span>
              <span className="text-text-faint text-sm">/</span>
              <span className="text-text-primary font-semibold text-sm">{manufacturer.name}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-text-faint hover:text-text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

          {/* Profile */}
          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">{manufacturer.name}</h2>
            <div className="divide-y divide-border-subtle">
              <InfoRow label="Website"   value={manufacturer.website_url} />
              <InfoRow label="ABN / ACN" value={manufacturer.abn} />
              <InfoRow label="Phone"     value={manufacturer.phone} />
              {manufacturer.description && (
                <div className="py-2 flex gap-3">
                  <span className="text-text-faint text-sm w-36 flex-shrink-0">About</span>
                  <span className="text-text-primary text-sm">{manufacturer.description}</span>
                </div>
              )}
              <InfoRow label="Member since" value={formatDate(manufacturer.created_at)} />
            </div>
          </section>

          {/* Contacts */}
          {contacts.length > 0 && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-base font-bold text-text-primary mb-4">Contacts</h2>
              <div className="divide-y divide-border-subtle">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <p className="text-text-primary text-sm font-medium">{c.name}</p>
                      {c.role && <p className="text-text-faint text-xs">{c.role}</p>}
                    </div>
                    <div className="text-right text-xs text-text-faint space-y-0.5">
                      {c.email && <p>{c.email}</p>}
                      {c.phone && <p>{c.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Products */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Your products
                  <span className="ml-2 text-sm font-normal text-text-faint">({systems.length})</span>
                </h2>
                {systems.length > 0 && (
                  <p className="text-xs text-text-faint mt-0.5">
                    {verifiedCount} of {systems.length} card{systems.length !== 1 ? 's' : ''} verified
                  </p>
                )}
              </div>
              {systems.length > 0 && (
                <button
                  onClick={() => setCardsOpen(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors"
                >
                  View as cards ↗
                </button>
              )}
            </div>

            {systems.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-8 text-center">
                <p className="text-text-faint text-sm">No products loaded yet.</p>
                <p className="text-text-faint text-xs mt-1">
                  Contact BuildQuote to import your product catalogue.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(byCategory).map(([category, catSystems]) => (
                  <div key={category} className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-border-subtle bg-page">
                      <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">{category}</p>
                    </div>
                    <div className="divide-y divide-border-subtle">
                      {catSystems.map(sys => {
                        const source = sources.find(s => s.id === sys.source_document_id)
                        return (
                          <div key={sys.id} className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-text-faint">{sys.product_code}</span>
                                  <span className="text-text-primary text-sm font-medium">{sys.name}</span>
                                  {sys.subcategory && (
                                    <span className="text-text-faint text-xs hidden sm:inline">— {sys.subcategory}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {source && (
                                <span className="text-xs text-text-faint hidden sm:block" title={source.document_name}>
                                  📄 {source.document_name.length > 22
                                    ? source.document_name.slice(0, 22) + '…'
                                    : source.document_name}
                                </span>
                              )}
                              {sys.verified_by ? (
                                <span className="text-xs text-success font-medium">✓ Verified</span>
                              ) : (
                                <button
                                  onClick={() => setCardsOpen(true)}
                                  className="text-xs text-text-faint hover:text-brand transition-colors"
                                >
                                  Verify →
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Catalogue sources */}
          {sources.length > 0 && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-base font-bold text-text-primary mb-1">Catalogue sources</h2>
              <p className="text-text-faint text-xs mb-4">
                Product data was extracted from the following documents.
              </p>
              <div className="divide-y divide-border-subtle">
                {sources.map(s => (
                  <div key={s.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="text-text-primary text-sm font-medium">{s.document_name}</p>
                      {s.document_date && (
                        <p className="text-text-faint text-xs mt-0.5">Published: {s.document_date}</p>
                      )}
                      {s.notes && (
                        <p className="text-text-faint text-xs mt-0.5">{s.notes}</p>
                      )}
                      <p className="text-text-faint text-xs mt-0.5">
                        Extracted {formatDate(s.extracted_at)}
                      </p>
                    </div>
                    {s.document_url && (
                      <a
                        href={s.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand hover:underline flex-shrink-0 mt-0.5"
                      >
                        View PDF ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Help */}
          <section className="bg-surface border border-border rounded-xl p-6 text-center space-y-1">
            <p className="text-text-faint text-sm">Need to update your product data or profile details?</p>
            <a
              href="mailto:hello@buildquote.com.au"
              className="text-brand text-sm hover:underline font-medium"
            >
              Contact BuildQuote →
            </a>
          </section>

          <p className="text-center text-text-faint text-xs pb-4">Powered by BuildQuote</p>

        </div>
      </div>
    </>
  )
}
