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
  sort_order: number
  source_document_id: string | null
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

export default function ManufacturerPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [loading, setLoading]           = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [notFound, setNotFound]         = useState(false)
  const [manufacturer, setManufacturer] = useState<ManufacturerData | null>(null)
  const [systems, setSystems]           = useState<System[]>([])
  const [sources, setSources]           = useState<CatalogueSource[]>([])
  const [contacts, setContacts]         = useState<Contact[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/manufacturer/login'
      return
    }

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

    // Make sure this user owns this manufacturer record
    if (mf.auth_user_id !== session.user.id) {
      setUnauthorized(true)
      setLoading(false)
      return
    }

    setManufacturer(mf as ManufacturerData)

    const [{ data: systemsData }, { data: sourcesData }, { data: contactsData }] = await Promise.all([
      supabase
        .from('systems')
        .select('id, name, product_code, category, subcategory, sort_order, source_document_id')
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

  // Group systems by category
  const byCategory = systems.reduce<Record<string, System[]>>((acc, sys) => {
    if (!acc[sys.category]) acc[sys.category] = []
    acc[sys.category].push(sys)
    return acc
  }, {})

  return (
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
            <h2 className="text-lg font-bold text-text-primary">
              Your products
              <span className="ml-2 text-sm font-normal text-text-faint">({systems.length})</span>
            </h2>
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
                          <div>
                            <span className="font-mono text-xs text-text-faint mr-2">{sys.product_code}</span>
                            <span className="text-text-primary text-sm font-medium">{sys.name}</span>
                            {sys.subcategory && (
                              <span className="text-text-faint text-xs ml-2">— {sys.subcategory}</span>
                            )}
                          </div>
                          {source && (
                            <span
                              className="text-xs text-text-faint flex-shrink-0"
                              title={`Source: ${source.document_name}`}
                            >
                              📄 {source.document_name.length > 28
                                ? source.document_name.slice(0, 28) + '…'
                                : source.document_name}
                            </span>
                          )}
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
  )
}
