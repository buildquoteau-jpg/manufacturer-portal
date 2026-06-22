'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SessionSystem = {
  id: string
  name: string
  product_code: string
  category: string
  subcategory: string | null
  description: string | null
  dimensions: string | null
  website_url: string | null
  manufacturers: {
    name: string
    website_url: string | null
  }
}

export default function SupplierReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplierId, setSupplierId]     = useState('')
  const [systems, setSystems]           = useState<SessionSystem[]>([])
  const [selectedIds, setSelectedIds]   = useState<string[]>([])
  const [submitted, setSubmitted]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState('')

  // Form
  const [name, setName]               = useState('')
  const [phone, setPhone]             = useState('')
  const [email, setEmail]             = useState('')
  const [suburb, setSuburb]           = useState('')
  const [requiredBy, setRequiredBy]   = useState('')
  const [delivery, setDelivery]       = useState('')
  const [measurements, setMeasurements] = useState('')
  const [notes, setNotes]             = useState('')

  useEffect(() => { loadSession() }, [token])

  async function loadSession() {
    const { data: session } = await supabase
      .from('customer_review_sessions')
      .select('id, supplier_id, customer_review_session_items ( system_id, sort_order )')
      .eq('token', token)
      .single()

    if (!session) { setNotFound(true); setLoading(false); return }

    setSupplierId(session.supplier_id)

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('name')
      .eq('id', session.supplier_id)
      .single()

    if (supplier) setSupplierName(supplier.name)

    const items = (session.customer_review_session_items as { system_id: string; sort_order: number }[])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)

    const systemIds = items.map(i => i.system_id)

    if (systemIds.length > 0) {
      const { data: sys } = await supabase
        .from('systems')
        .select('id, name, product_code, category, subcategory, description, dimensions, website_url, manufacturers ( name, website_url )')
        .in('id', systemIds)

      if (sys) {
        const ordered = systemIds
          .map(id => (sys as unknown as SessionSystem[]).find(s => s.id === id))
          .filter((s): s is SessionSystem => !!s)
        setSystems(ordered)
        setSelectedIds(systemIds)
      }
    }

    setLoading(false)
  }

  function toggleSystem(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || (!email && !phone)) return
    setSubmitting(true); setSubmitError('')

    const selected = systems.filter(s => selectedIds.includes(s.id))
    const systemNames  = selected.map(s => s.name).join(', ')
    const productCodes = selected.map(s => s.product_code).filter(Boolean).join(', ')

    const messageParts = [
      measurements && `Measurements / qty: ${measurements}`,
      delivery     && `Delivery preference: ${delivery}`,
      requiredBy   && `Required by: ${requiredBy}`,
      suburb       && `Job location: ${suburb}`,
      notes        && `Notes: ${notes}`,
    ].filter(Boolean)

    const { error } = await supabase
      .from('rfq_enquiries')
      .insert({
        supplier_name: supplierName,
        system_name:   systemNames  || null,
        product_code:  productCodes || null,
        name,
        email:   email  || '',
        phone:   phone  || null,
        message: messageParts.join('\n') || null,
      })

    if (error) { setSubmitError('Something went wrong. Please try again.'); setSubmitting(false); return }
    setSubmitted(true)
  }

  // ── Loading / error / success states ─────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <p className="text-text-faint text-sm">Loading…</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center space-y-2">
        <p className="text-text-faint text-sm">This review link is not valid or has expired.</p>
        <p className="text-text-faint text-xs">Contact your supplier for a new link.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto text-2xl">✓</div>
        <h2 className="font-bold text-text-primary text-lg">Quote request sent</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          {supplierName} has received your request and will be in touch soon.
        </p>
        <p className="text-text-faint text-xs">Powered by BuildQuote</p>
      </div>
    </div>
  )

  const inputCls = 'w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors'

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold tracking-widest text-text-faint uppercase">
            BUILD<span className="text-brand">QUOTE</span>
          </span>
          <h1 className="text-xl font-bold text-text-primary mt-2">{supplierName}</h1>
          <p className="text-text-secondary text-sm">
            {supplierName} has suggested these product options for your project.
          </p>
        </div>

        {/* Product cards */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">
            Suggested products — tap to select
          </p>
          {systems.map(sys => {
            const mfr     = sys.manufacturers as { name: string; website_url: string | null }
            const website = sys.website_url || mfr?.website_url
            const selected = selectedIds.includes(sys.id)
            return (
              <div
                key={sys.id}
                onClick={() => toggleSystem(sys.id)}
                className={`bg-surface border rounded-xl p-4 cursor-pointer transition-all select-none ${
                  selected ? 'border-brand' : 'border-border opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                      selected ? 'bg-brand border-brand' : 'border-border'
                    }`}
                  >
                    {selected && <span className="text-white text-xs font-bold leading-none">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm leading-snug" style={{ wordBreak: 'break-word' }}>
                      {sys.name}
                    </p>
                    <p className="text-text-faint text-xs mt-0.5">{mfr?.name}</p>
                    {sys.product_code && (
                      <p className="font-mono text-xs text-text-faint mt-1">{sys.product_code}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-0.5">
                      {sys.category}{sys.subcategory ? ` · ${sys.subcategory}` : ''}
                    </p>
                    {sys.dimensions && (
                      <p className="text-xs text-text-faint mt-0.5">{sys.dimensions}</p>
                    )}
                    {sys.description && (
                      <p className="text-xs text-text-faint mt-1 line-clamp-3">{sys.description}</p>
                    )}
                    {website && (
                      <a
                        href={website} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-2 inline-block text-xs text-brand hover:underline"
                      >
                        View manufacturer website ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <p className="text-xs text-text-faint text-center">
            Tick the products you'd like quoted, then fill in the form below.
          </p>
        </div>

        {/* Prompt */}
        <div className="bg-surface border border-border rounded-xl px-5 py-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Check your measurements, choose the product options you want quoted, then send your
            request back to <strong className="text-text-primary">{supplierName}</strong>.
          </p>
        </div>

        {/* Quote request form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">Your details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                required placeholder="Your name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Mobile or phone" type="tel" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" type="email" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Job suburb / location</label>
              <input value={suburb} onChange={e => setSuburb(e.target.value)}
                placeholder="Suburb" className={inputCls} />
            </div>
          </div>

          <p className="text-xs font-semibold text-text-faint uppercase tracking-widest pt-2">Project details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Required by (optional)</label>
              <input value={requiredBy} onChange={e => setRequiredBy(e.target.value)}
                type="date" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Pickup or delivery</label>
              <select value={delivery} onChange={e => setDelivery(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option value="Pickup">Pickup</option>
                <option value="Delivery">Delivery</option>
                <option value="Not sure yet">Not sure yet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Quantity / measurements</label>
            <textarea value={measurements} onChange={e => setMeasurements(e.target.value)}
              placeholder="e.g. 12 sheets 2400×1200, or list each item with dimensions"
              rows={3} className={inputCls + ' resize-none'} />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any other details for your quote request"
              rows={2} className={inputCls + ' resize-none'} />
          </div>

          {submitError && <p className="text-error text-sm">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting || !name || (!email && !phone) || selectedIds.length === 0}
            className="w-full py-3.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors"
          >
            {submitting ? 'Sending…' : `Send quote request to ${supplierName}`}
          </button>

          <p className="text-center text-xs text-text-faint">
            Your details are shared only with {supplierName}.
          </p>
        </form>

        <p className="text-center text-xs text-text-faint pb-4">Powered by BuildQuote</p>
      </div>
    </div>
  )
}
