'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { use } from 'react'

type WidgetRecord = {
  id: string
  name: string
  public_token: string
  status: string
  created_at: string
  embed_widget_systems: {
    systems: { name: string; product_code: string }
  }[]
}

type RfqEnquiry = {
  id: string
  system_name: string | null
  product_code: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  created_at: string
}

type SupplierData = {
  id: string
  name: string
  slug: string
  address: string | null
  suburb: string | null
  state: string | null
  website_url: string | null
  email: string | null
  phone: string | null
  manager_name: string | null
  it_name: string | null
  it_email: string | null
  portal_password: string | null
  created_at: string
  embed_widgets: WidgetRecord[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildEmbedCode(token: string, origin: string) {
  return `<iframe src="${origin}/widget/${token}" width="100%" height="800" frameborder="0" style="border:none;border-radius:12px;"></iframe>`
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors">
      {copied ? 'Copied!' : label}
    </button>
  )
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

export default function SupplierPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [origin, setOrigin] = useState('')
  const [enquiries, setEnquiries] = useState<RfqEnquiry[]>([])

  useEffect(() => {
    setOrigin(window.location.origin)
    loadSupplier()
  }, [])

  async function loadSupplier() {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        id, name, slug, address, suburb, state, website_url, email, phone,
        manager_name, it_name, it_email, portal_password, created_at,
        embed_widgets (
          id, name, public_token, status, created_at,
          embed_widget_systems ( systems ( name, product_code ) )
        )
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const s = data as unknown as SupplierData
    setSupplier(s)

    // Restore session if already authenticated
    const stored = sessionStorage.getItem(`supplier_portal_${slug}`)
    if (stored && s.portal_password && stored === s.portal_password) {
      setAuthed(true)
      loadEnquiries(s)
    }

    setLoading(false)
  }

  async function loadEnquiries(s: SupplierData) {
    const widgetIds = s.embed_widgets.map(w => w.id)
    if (widgetIds.length === 0) return
    const { data } = await supabase
      .from('rfq_enquiries')
      .select('id, system_name, product_code, name, email, phone, message, created_at')
      .in('widget_id', widgetIds)
      .order('created_at', { ascending: false })
    if (data) setEnquiries(data as RfqEnquiry[])
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!supplier?.portal_password) return
    if (passwordInput === supplier.portal_password) {
      sessionStorage.setItem(`supplier_portal_${slug}`, passwordInput)
      setAuthed(true)
      loadEnquiries(supplier)
    } else {
      setPasswordError(true)
      setTimeout(() => setPasswordError(false), 2000)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="text-text-faint text-sm">Loading...</p>
      </div>
    )
  }

  if (notFound || !supplier) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-text-faint text-sm">Supplier portal not found.</p>
          <p className="text-text-faint text-xs mt-1">Check the URL is correct or contact BuildQuote.</p>
        </div>
      </div>
    )
  }

  // ── Password gate ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-2xl font-semibold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <p className="text-text-primary font-semibold mt-3">{supplier.name}</p>
            <p className="text-text-faint text-sm mt-1">Supplier Portal</p>
          </div>
          <form onSubmit={handleLogin} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoFocus
                className={`w-full bg-ui border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand transition-colors ${passwordError ? 'border-error' : 'border-border'}`}
                placeholder="Enter your portal password" />
              {passwordError && <p className="text-error text-xs mt-1">Incorrect password. Contact BuildQuote if you need help.</p>}
            </div>
            <button type="submit"
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold text-sm transition-colors">
              Sign in
            </button>
          </form>
          <p className="text-center text-text-faint text-xs mt-4">
            Need access? Contact <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">BuildQuote</a>
          </p>
        </div>
      </div>
    )
  }

  // ── Supplier dashboard ────────────────────────────────────────────────────
  const location = [supplier.address, supplier.suburb, supplier.state].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-page">

      {/* Nav */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <span className="text-text-faint text-sm">/</span>
            <span className="text-text-primary font-semibold text-sm">{supplier.name}</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem(`supplier_portal_${slug}`); setAuthed(false) }}
            className="text-xs text-text-faint hover:text-text-primary transition-colors">
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Business details */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-1">{supplier.name}</h2>
          {location && <p className="text-text-faint text-sm mb-5">{location}</p>}

          <div className="divide-y divide-border-subtle">
            <InfoRow label="Website" value={supplier.website_url} />
            <InfoRow label="Email" value={supplier.email} />
            <InfoRow label="Phone" value={supplier.phone} />
            <InfoRow label="Manager" value={supplier.manager_name} />
            <InfoRow label="IT contact" value={supplier.it_name ? `${supplier.it_name}${supplier.it_email ? ` — ${supplier.it_email}` : ''}` : supplier.it_email} />
            <InfoRow label="Member since" value={formatDate(supplier.created_at)} />
          </div>
        </section>

        {/* Widgets */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-5">
            Your widgets
            <span className="ml-2 text-sm font-normal text-text-faint">({supplier.embed_widgets.length})</span>
          </h2>

          {supplier.embed_widgets.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <p className="text-text-faint text-sm">No widgets set up yet. Contact BuildQuote to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {supplier.embed_widgets
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(widget => {
                  const profiles = widget.embed_widget_systems.map(ews => ews.systems)
                  const code = buildEmbedCode(widget.public_token, origin)
                  return (
                    <div key={widget.id} className="bg-surface border border-border rounded-xl p-5">

                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="font-semibold text-text-primary text-sm">
                            {profiles.length} product{profiles.length !== 1 ? 's' : ''} in this widget
                          </p>
                          <p className="text-text-faint text-xs mt-0.5">Created {formatDate(widget.created_at)}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${widget.status === 'active' ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                          {widget.status}
                        </span>
                      </div>

                      {/* Products */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {profiles.map((sys, i) => (
                          <span key={i} className="text-xs bg-brand-subtle text-brand-bright px-2.5 py-1 rounded-full font-medium">
                            {sys.product_code} — {sys.name}
                          </span>
                        ))}
                      </div>

                      {/* Embed code */}
                      <div>
                        <p className="text-xs text-text-faint font-medium mb-1.5">Embed code</p>
                        <div className="bg-page rounded-lg px-3 py-2.5 font-mono text-xs text-text-faint break-all leading-relaxed mb-3">
                          {code}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <CopyButton text={code} label="Copy embed code" />
                          <a href={`/widget/${widget.public_token}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors">
                            Preview widget ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </section>

        {/* Enquiries */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-5">
            Product enquiries
            <span className="ml-2 text-sm font-normal text-text-faint">({enquiries.length})</span>
          </h2>

          {enquiries.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <p className="text-text-faint text-sm">No enquiries yet. They will appear here when visitors submit a request via your widget.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map(enq => (
                <div key={enq.id} className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{enq.name}</p>
                      <p className="text-text-faint text-xs mt-0.5">{enq.email}{enq.phone ? ` · ${enq.phone}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {enq.product_code && (
                        <span className="text-xs bg-brand-subtle text-brand-bright px-2.5 py-1 rounded-full font-medium">
                          {enq.product_code}
                        </span>
                      )}
                      <p className="text-text-faint text-xs mt-1">{formatDate(enq.created_at)}</p>
                    </div>
                  </div>
                  {enq.message && (
                    <p className="text-text-secondary text-sm leading-relaxed border-t border-border-subtle pt-3">{enq.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Help */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-text-primary mb-2">Need to make changes?</h2>
          <p className="text-text-faint text-sm">
            To update the products shown in your widget, add a new widget, or change your business details, contact BuildQuote:
          </p>
          <div className="mt-3 flex gap-4">
            <a href="mailto:hello@buildquote.com.au" className="text-brand text-sm hover:underline">hello@buildquote.com.au</a>
            <a href="https://buildquote.com.au" target="_blank" rel="noopener noreferrer" className="text-brand text-sm hover:underline">buildquote.com.au</a>
          </div>
        </section>

        <p className="text-center text-text-faint text-xs">Powered by BuildQuote</p>
      </div>
    </div>
  )
}
