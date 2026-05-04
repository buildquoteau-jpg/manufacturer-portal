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

type SystemProfile = {
  id: string
  name: string | null
  product_code: string | null
  dimensions: string | null
  length_m: number | null
  sort_order: number
}

type System = {
  id: string
  name: string
  product_code: string
  category: string
  subcategory: string | null
  description: string | null
  dimensions: string | null
  length_m: number | null
  double_sided: boolean
  hero_image_url: string | null
  website_url: string | null
  sort_order: number
  source_document_id: string | null
  verified_by: string | null
  verified_at: string | null
  change_notes: string | null
  system_colours: SystemColour[]
  system_components: SystemComponent[]
  system_profiles: SystemProfile[]
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

const COLOUR_MAP: Record<string, string> = {
  'Antique': '#9B7B5A', 'Teak': '#7D5A3C', 'Walnut': '#5C3D2E',
  'Blackbutt': '#C4A882', 'Ipe': '#6B4226', 'Silver Grey': '#A8A9AD',
  'Beech': '#D4B896', 'Aged Wood': '#8B7355', 'Canadian Cedar': '#A0522D',
  'Ebony': '#2C2C2C', 'Ebony (Charred)': '#1A1A1A', 'Sea Salt': '#D8DCD8',
}

const CATEGORY_BG: Record<string, string> = {
  'Decking': '#d1fae5', 'Cladding': '#dbeafe', 'Screening & Fencing': '#fef3c7',
  'Exterior Cladding': '#dbeafe', 'Interior Lining': '#ede9fe',
}
const CATEGORY_TEXT: Record<string, string> = {
  'Decking': '#065f46', 'Cladding': '#1e40af', 'Screening & Fencing': '#92400e',
  'Exterior Cladding': '#1e40af', 'Interior Lining': '#5b21b6',
}

// ── Verification panel ────────────────────────────────────────────────────────

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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ systemId: system.id, verifiedBy: name, changeNotes: notes }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed to save'); setMode('form'); return }
    onUpdate({ verified_by: json.system.verified_by, verified_at: json.system.verified_at, change_notes: json.system.change_notes })
    setMode('idle')
  }

  async function handleRemove() {
    setRemoving(true)
    const res = await fetch('/api/manufacturer/verify-system', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ systemId: system.id }),
    })
    const json = await res.json()
    if (!res.ok) { setRemoving(false); return }
    onUpdate({ verified_by: json.system.verified_by, verified_at: json.system.verified_at, change_notes: json.system.change_notes })
    setRemoving(false)
  }

  if (isVerified) {
    return (
      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#059669', fontSize: '13px' }}>✓</span>
              <span style={{ color: '#059669', fontSize: '13px', fontWeight: 600 }}>Verified</span>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '3px 0 0' }}>
              <strong style={{ color: '#374151' }}>{system.verified_by}</strong>
              {system.verified_at && ` · ${formatDate(system.verified_at)}`}
            </p>
            {system.change_notes && (
              <div style={{
                marginTop: '8px', padding: '8px 10px', borderRadius: '8px',
                background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '11px',
                color: '#92400e', lineHeight: 1.5,
              }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Changes needed:</strong>
                {system.change_notes}
              </div>
            )}
          </div>
          <button onClick={handleRemove} disabled={removing}
            style={{ fontSize: '11px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'idle') {
    return (
      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e5e7eb' }}>
        <button onClick={() => setMode('form')}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px', background: 'none',
            border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 14px',
            cursor: 'pointer', fontSize: '13px', color: '#6b7280', width: '100%',
            justifyContent: 'center',
          }}>
          <span style={{
            width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#9ca3af',
          }}>✓</span>
          Verify this card
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e5e7eb' }}>
      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Verified by
          </label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus
            style={{
              width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px',
              border: '1px solid #e5e7eb', outline: 'none', boxSizing: 'border-box', background: '#fafafa',
            }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Changes needed <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Update colour options — Ash discontinued."
            rows={2}
            style={{
              width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px',
              border: '1px solid #e5e7eb', outline: 'none', boxSizing: 'border-box',
              background: '#fafafa', resize: 'none', fontFamily: 'inherit',
            }} />
        </div>
        {error && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="submit" disabled={mode === 'saving'}
            style={{
              padding: '8px 16px', background: '#1b3a2d', color: '#fff', border: 'none',
              borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
            {mode === 'saving' ? 'Saving…' : 'Confirm'}
          </button>
          <button type="button" onClick={() => { setMode('idle'); setError('') }}
            style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Rich system card (widget-style) ───────────────────────────────────────────

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
  const catBg   = CATEGORY_BG[system.category]   || '#f3f4f6'
  const catText = CATEGORY_TEXT[system.category] || '#374151'
  const stocked = system.system_colours.filter(c => c.is_stocked)
  const required    = system.system_components.filter(c => c.role === 'required'    && c.components)
  const recommended = system.system_components.filter(c => c.role === 'recommended' && c.components)
  const profiles = (system.system_profiles || []).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e5e7eb',
      borderRadius: '12px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Hero image */}
      <div style={{
        height: '160px',
        background: system.hero_image_url
          ? `url(${system.hero_image_url}) center/cover no-repeat`
          : '#f3f4f6',
        position: 'relative', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!system.hero_image_url && (
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#d1d5db', fontFamily: 'monospace' }}>
            {system.product_code}
          </span>
        )}
        {/* Category badge */}
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          background: catBg, color: catText, padding: '3px 8px', borderRadius: '20px',
        }}>
          {system.category}
        </span>
        {system.double_sided && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            fontSize: '10px', fontWeight: 600, background: '#fff', color: '#374151',
            padding: '3px 8px', borderRadius: '20px', border: '1px solid #e5e7eb',
          }}>
            Double sided
          </span>
        )}
        {/* Verified badge over image */}
        {system.verified_by && (
          <span style={{
            position: 'absolute', bottom: '10px', right: '10px',
            fontSize: '10px', fontWeight: 700, background: '#d1fae5', color: '#065f46',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            ✓ Verified
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Name + code */}
        <div style={{ marginBottom: '4px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {system.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px', fontFamily: 'monospace', fontWeight: 600,
              color: '#6b7280', background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px',
            }}>
              {system.product_code}
            </span>
            {system.dimensions && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {system.dimensions}{system.length_m ? ` · ${system.length_m}m` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {system.description && (
          <p style={{
            margin: '8px 0 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {system.description}
          </p>
        )}

        {/* Profiles / Size variants */}
        {profiles.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px',
            }}>
              Sizes &amp; Product Codes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {profiles.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '5px 8px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #f3f4f6',
                }}>
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: '#374151' }}>
                    {p.name || p.dimensions || '—'}
                  </span>
                  {p.product_code && (
                    <span style={{
                      fontSize: '11px', fontFamily: 'monospace', color: '#6b7280',
                      background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px', flexShrink: 0,
                    }}>
                      {p.product_code}
                    </span>
                  )}
                  {p.length_m && (
                    <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
                      {p.length_m}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Colours */}
        {stocked.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px',
            }}>
              Available Colours
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {stocked.map(c => (
                <span key={c.colour_name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', color: '#6b7280', background: '#f3f4f6',
                  borderRadius: '20px', padding: '3px 8px 3px 5px',
                }}>
                  <span style={{
                    display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                    background: COLOUR_MAP[c.colour_name] || '#888', border: '1px solid rgba(0,0,0,0.15)',
                  }} />
                  {c.colour_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Components */}
        {(required.length > 0 || recommended.length > 0) && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', flex: 1 }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px',
            }}>
              Fixings &amp; Components
            </div>
            {[{ items: required, role: 'Required' }, { items: recommended, role: 'Recommended' }].map(({ items, role }) =>
              items.length === 0 ? null : (
                <div key={role} style={{ marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: role === 'Required' ? '#374151' : '#9ca3af', marginBottom: '5px',
                  }}>
                    {role}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {items.map((item, i) => (
                      <div key={i} style={{
                        padding: '6px 10px', background: role === 'Required' ? '#f9fafb' : '#fafafa',
                        border: `1px solid ${role === 'Required' ? '#e5e7eb' : '#f3f4f6'}`, borderRadius: '6px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                            {item.components!.name}
                          </span>
                          {item.components!.sku && (
                            <span style={{
                              fontSize: '10px', fontFamily: 'monospace', color: '#6b7280',
                              background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px', flexShrink: 0,
                            }}>
                              {item.components!.sku}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{item.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Source doc */}
        {source && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>📄</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{source.document_name}</span>
          </div>
        )}

        {/* Verification */}
        <VerificationPanel
          system={system}
          accessToken={accessToken}
          onUpdate={updated => onUpdate(system.id, updated)}
        />
      </div>
    </div>
  )
}

// ── Cards overlay ─────────────────────────────────────────────────────────────

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
          <button onClick={onClose}
            className="text-text-faint hover:text-text-primary text-2xl leading-none px-2 transition-colors">
            ×
          </button>
        </div>
      </div>

      {/* Cards grid — white-background widget style */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {systems.length === 0 ? (
          <p className="text-text-faint text-sm text-center py-12">No products loaded yet.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
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
                    <span className="text-xs text-success font-medium flex-shrink-0">✓ {sys.verified_by}</span>
                  ) : (
                    <span className="text-xs text-text-faint flex-shrink-0">Unverified</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-text-faint text-xs mt-8 pb-4">Powered by BuildQuote</p>
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
    if (!session) { window.location.href = '/manufacturer/login'; return }
    setAccessToken(session.access_token)

    const { data: mf, error } = await supabase
      .from('manufacturers')
      .select('id, name, slug, logo_url, website_url, description, abn, phone, auth_user_id, created_at')
      .eq('slug', slug)
      .single()

    if (error || !mf) { setNotFound(true); setLoading(false); return }
    if (mf.auth_user_id !== session.user.id) { setUnauthorized(true); setLoading(false); return }

    setManufacturer(mf as ManufacturerData)

    const [{ data: systemsData }, { data: sourcesData }, { data: contactsData }] = await Promise.all([
      supabase
        .from('systems')
        .select(`
          id, name, product_code, category, subcategory, description,
          dimensions, length_m, double_sided, hero_image_url, website_url,
          sort_order, source_document_id, verified_by, verified_at, change_notes,
          system_colours ( colour_name, is_stocked, sort_order ),
          system_components ( role, notes, sort_order, components ( name, sku ) ),
          system_profiles ( id, name, product_code, dimensions, length_m, sort_order )
        `)
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

    if (systemsData)  setSystems(systemsData as unknown as System[])
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

  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <p className="text-text-faint text-sm">Loading…</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center space-y-2">
        <p className="text-text-faint text-sm">Manufacturer portal not found.</p>
        <Link href="/" className="text-brand text-xs hover:underline block">← Back to home</Link>
      </div>
    </div>
  )

  if (unauthorized) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-text-faint text-sm">You don't have access to this portal.</p>
        <button onClick={handleSignOut} className="text-brand text-xs hover:underline block mx-auto">
          Sign out and try another account
        </button>
      </div>
    </div>
  )

  if (!manufacturer) return null

  const byCategory = systems.reduce<Record<string, System[]>>((acc, sys) => {
    if (!acc[sys.category]) acc[sys.category] = []
    acc[sys.category].push(sys)
    return acc
  }, {})

  const verifiedCount = systems.filter(s => s.verified_by).length

  return (
    <>
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
            <button onClick={handleSignOut} className="text-xs text-text-faint hover:text-text-primary transition-colors">
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
                <button onClick={() => setCardsOpen(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors">
                  View as cards ↗
                </button>
              )}
            </div>

            {systems.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-8 text-center">
                <p className="text-text-faint text-sm">No products loaded yet.</p>
                <p className="text-text-faint text-xs mt-1">Contact BuildQuote to import your product catalogue.</p>
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
                        const src = sources.find(s => s.id === sys.source_document_id)
                        return (
                          <div key={sys.id} className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-xs text-text-faint">{sys.product_code}</span>
                              <span className="text-text-primary text-sm font-medium">{sys.name}</span>
                              {sys.subcategory && (
                                <span className="text-text-faint text-xs hidden sm:inline">— {sys.subcategory}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {src && (
                                <span className="text-xs text-text-faint hidden sm:block" title={src.document_name}>
                                  📄 {src.document_name.length > 22 ? src.document_name.slice(0, 22) + '…' : src.document_name}
                                </span>
                              )}
                              {sys.verified_by ? (
                                <span className="text-xs text-success font-medium">✓ Verified</span>
                              ) : (
                                <button onClick={() => setCardsOpen(true)}
                                  className="text-xs text-text-faint hover:text-brand transition-colors">
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
              <p className="text-text-faint text-xs mb-4">Product data was extracted from the following documents.</p>
              <div className="divide-y divide-border-subtle">
                {sources.map(s => (
                  <div key={s.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="text-text-primary text-sm font-medium">{s.document_name}</p>
                      {s.document_date && <p className="text-text-faint text-xs mt-0.5">Published: {s.document_date}</p>}
                      {s.notes && <p className="text-text-faint text-xs mt-0.5">{s.notes}</p>}
                      <p className="text-text-faint text-xs mt-0.5">Extracted {formatDate(s.extracted_at)}</p>
                    </div>
                    {s.document_url && (
                      <a href={s.document_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-brand hover:underline flex-shrink-0 mt-0.5">
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
            <a href="mailto:hello@buildquote.com.au" className="text-brand text-sm hover:underline font-medium">
              Contact BuildQuote →
            </a>
          </section>

          <p className="text-center text-text-faint text-xs pb-4">Powered by BuildQuote</p>
        </div>
      </div>
    </>
  )
}
