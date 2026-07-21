'use client'

import { useState, useMemo, useEffect } from 'react'
import { SupplierData, Manufacturer } from './shared'
import { fuzzyIncludes } from '@/lib/fuzzyMatch'

// ── Types ─────────────────────────────────────────────────────────────────────

type StockedItem = {
  systemId: string
  systemName: string
  productCode: string
  category: string
  subcategory: string | null
  description: string | null
  dimensions: string | null
  manufacturerId: string
  manufacturerName: string
  manufacturerWebsite: string | null
  systemWebsite: string | null
}

type QuotePrepItem = {
  localId: string
  systemId: string
  systemName: string
  manufacturer: string
  productCode: string
  dimensions: string | null
  qty: number
  uom: string
  notes: string
}

// ── Search ────────────────────────────────────────────────────────────────────
// Weighted, fuzzy, ranked — a typed word landing in the product name counts
// for far more than one only found in the description, and a single typo
// ("claddng") still matches via fuzzyIncludes' bounded edit distance.

const FIELD_WEIGHT = {
  name: 10,
  productCode: 8,
  category: 6,
  manufacturer: 4,
  dimensions: 3,
  description: 2,
} as const

function searchItems(items: StockedItem[], query: string): StockedItem[] {
  const q = query.trim()
  if (!q) return []
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const fieldsOf = (item: StockedItem) => [
    { text: item.systemName, weight: FIELD_WEIGHT.name },
    { text: item.productCode, weight: FIELD_WEIGHT.productCode },
    { text: [item.category, item.subcategory ?? ''].join(' '), weight: FIELD_WEIGHT.category },
    { text: item.manufacturerName, weight: FIELD_WEIGHT.manufacturer },
    { text: item.dimensions ?? '', weight: FIELD_WEIGHT.dimensions },
    { text: item.description ?? '', weight: FIELD_WEIGHT.description },
  ]

  const scored = items
    .map(item => {
      const fields = fieldsOf(item)
      let score = 0
      for (const term of terms) {
        let matched = false
        for (const f of fields) {
          if (fuzzyIncludes(f.text, term)) { score += f.weight; matched = true }
        }
        // Every typed word must match somewhere (AND across terms), same
        // behaviour as the old substring filter — just fuzzy per-term now.
        if (!matched) return { item, score: -1 }
      }
      return { item, score }
    })
    .filter(r => r.score >= 0)
    .sort((a, b) => b.score - a.score)

  return scored.map(r => r.item)
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
  item,
  onAddToQuotePrep,
  onSendReviewLink,
  onToggleSelect,
  alreadyAdded,
  selected,
}: {
  item: StockedItem
  onAddToQuotePrep: (item: StockedItem) => void
  onSendReviewLink: (item: StockedItem) => void
  onToggleSelect: (item: StockedItem) => void
  alreadyAdded: boolean
  selected: boolean
}) {
  const website = item.systemWebsite || item.manufacturerWebsite

  return (
    <div className={`bg-surface border rounded-xl p-4 flex flex-col gap-3 transition-colors ${selected ? 'border-brand' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm leading-snug" style={{ wordBreak: 'break-word' }}>
            {item.systemName}
          </p>
          <p className="text-text-faint text-xs mt-0.5">{item.manufacturerName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-subtle text-brand font-medium">
            Stocked
          </span>
          {/* Selection checkbox for multi-send */}
          <button
            onClick={() => onToggleSelect(item)}
            title={selected ? 'Deselect' : 'Select for review link'}
            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              selected ? 'bg-brand border-brand' : 'border-border hover:border-brand'
            }`}
          >
            {selected && <span className="text-white text-xs font-bold leading-none">✓</span>}
          </button>
        </div>
      </div>

      <div className="space-y-0.5">
        {item.productCode && (
          <p className="font-mono text-xs text-text-faint">
            <span className="text-text-muted">SKU</span> {item.productCode}
          </p>
        )}
        <p className="text-xs text-text-secondary">
          {item.category}{item.subcategory ? ` · ${item.subcategory}` : ''}
        </p>
        {item.dimensions && (
          <p className="text-xs text-text-faint">{item.dimensions}</p>
        )}
        {item.description && (
          <p className="text-xs text-text-faint line-clamp-2 mt-1">{item.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-border-subtle">
        <button
          onClick={() => onAddToQuotePrep(item)}
          disabled={alreadyAdded}
          className="flex-1 min-w-[130px] py-2 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-default text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {alreadyAdded ? '✓ In quote prep' : 'Add to quote prep'}
        </button>
        <button
          onClick={() => onSendReviewLink(item)}
          className="flex-1 min-w-[130px] py-2 bg-ui hover:bg-surface-hover border border-border text-text-secondary text-xs font-medium rounded-lg transition-colors"
        >
          Send review link
        </button>
        {website && (
          <a
            href={website} target="_blank" rel="noopener noreferrer"
            className="w-full py-1.5 text-center text-xs text-text-faint hover:text-brand transition-colors"
          >
            View manufacturer website ↗
          </a>
        )}
      </div>
    </div>
  )
}

// ── Quote prep panel ──────────────────────────────────────────────────────────

function QuotePrepPanel({
  items,
  onUpdateQty,
  onUpdateUom,
  onUpdateNotes,
  onRemove,
  onClear,
  onSendReviewLink,
}: {
  items: QuotePrepItem[]
  onUpdateQty: (id: string, qty: number) => void
  onUpdateUom: (id: string, uom: string) => void
  onUpdateNotes: (id: string, notes: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onSendReviewLink: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copyForPos() {
    const header = 'SKU\tDescription\tQty\tUnit\tNotes'
    const rows = items.map(item =>
      [
        item.productCode || '—',
        `${item.systemName}${item.dimensions ? ` (${item.dimensions})` : ''}`,
        item.qty,
        item.uom || 'ea',
        item.notes,
      ].join('\t')
    )
    navigator.clipboard.writeText([header, ...rows].join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 text-center">
        <p className="text-text-secondary text-sm font-semibold">Quote prep</p>
        <p className="text-text-faint text-xs mt-1.5 leading-relaxed">
          Add confirmed items here, then copy lines into your POS.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-semibold text-text-primary text-sm">
          Quote prep <span className="text-brand ml-1.5">{items.length}</span>
        </p>
        <button onClick={onClear} className="text-xs text-text-faint hover:text-error transition-colors">
          Clear all
        </button>
      </div>

      <div className="divide-y divide-border-subtle overflow-y-auto" style={{ maxHeight: '480px' }}>
        {items.map(item => (
          <div key={item.localId} className="px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary leading-snug" style={{ wordBreak: 'break-word' }}>
                  {item.systemName}
                </p>
                <p className="text-xs text-text-faint mt-0.5">
                  {item.manufacturer}
                  {item.productCode && (
                    <span className="font-mono ml-2 text-text-muted">{item.productCode}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onRemove(item.localId)}
                className="text-text-faint hover:text-error text-lg leading-none mt-0.5 flex-shrink-0 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-shrink-0 w-14">
                <label className="block text-xs text-text-faint mb-1">Qty</label>
                <input
                  type="number" min={1} value={item.qty}
                  onChange={e => onUpdateQty(item.localId, Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-ui border border-border rounded px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-brand"
                />
              </div>
              <div className="flex-shrink-0 w-14">
                <label className="block text-xs text-text-faint mb-1">Unit</label>
                <input
                  type="text" value={item.uom} placeholder="ea"
                  onChange={e => onUpdateUom(item.localId, e.target.value)}
                  className="w-full bg-ui border border-border rounded px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-brand"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-text-faint mb-1">Notes</label>
                <input
                  type="text" value={item.notes} placeholder="e.g. pre-primed, 2040×820"
                  onChange={e => onUpdateNotes(item.localId, e.target.value)}
                  className="w-full bg-ui border border-border rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border space-y-2">
        <button
          onClick={copyForPos}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy lines for POS'}
        </button>
        <button
          onClick={onSendReviewLink}
          className="w-full py-2 bg-ui hover:bg-surface-hover border border-border text-text-secondary text-xs font-medium rounded-lg transition-colors"
        >
          Send review link for these items
        </button>
        <p className="text-center text-xs text-text-faint">Tab-separated: SKU · Description · Qty · Unit · Notes</p>
      </div>
    </div>
  )
}

// ── Send review link modal ────────────────────────────────────────────────────

function SendReviewLinkModal({
  items,
  supplierSlug,
  supplierName,
  accessToken,
  origin,
  onClose,
}: {
  items: StockedItem[]
  supplierSlug: string
  supplierName: string
  accessToken: string
  origin: string
  onClose: () => void
}) {
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile]             = useState('')
  const [email, setEmail]               = useState('')
  const [note, setNote]                 = useState('')
  const [creating, setCreating]         = useState(false)
  const [reviewLink, setReviewLink]     = useState<string | null>(null)
  const [emailSent, setEmailSent]       = useState(false)
  const [error, setError]               = useState('')
  const [copied, setCopied]             = useState(false)

  async function handleCreate() {
    setCreating(true); setError('')
    const res = await fetch('/api/supplier/create-review-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        supplierSlug,
        systemIds: items.map(i => i.systemId),
        customerName:   customerName || null,
        customerMobile: mobile       || null,
        customerEmail:  email        || null,
        staffNote:      note         || null,
        origin,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed to create link'); setCreating(false); return }
    setReviewLink(`${origin}/supplier-review/${json.token}`)
    setEmailSent(!!json.emailSent)
    setCreating(false)
  }

  function copyLink() {
    if (!reviewLink) return
    navigator.clipboard.writeText(reviewLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const inputCls = 'w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-text-primary">Send review link</h3>
            <p className="text-xs text-text-faint mt-0.5">
              {items.length} product{items.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button onClick={onClose} className="text-text-faint hover:text-text-primary text-xl px-1 leading-none">×</button>
        </div>

        {!reviewLink ? (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-ui rounded-lg px-3 py-2.5 space-y-1">
              {items.map(item => (
                <p key={item.systemId} className="text-xs text-text-secondary">
                  <span className="text-text-faint">{item.manufacturerName}</span> · {item.systemName}
                </p>
              ))}
            </div>

            <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">Customer details (optional)</p>
            <div className="space-y-3">
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer name" className={inputCls} />
              <input value={mobile} onChange={e => setMobile(e.target.value)}
                placeholder="Mobile" type="tel" className={inputCls} />
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email" type="email" className={inputCls} />
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Staff note (not shown to customer)" rows={2}
                className={inputCls + ' resize-none'} />
            </div>

            {error && <p className="text-error text-xs">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {creating ? 'Creating link…' : 'Create review link'}
              </button>
              <button onClick={onClose} className="text-sm text-text-faint hover:text-text-primary transition-colors px-2">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-brand-subtle border border-brand/30 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-brand uppercase tracking-widest">Review link ready</p>
              {emailSent && (
                <p className="text-xs text-success font-medium">✓ Email sent to {email}</p>
              )}
              <p className="text-xs text-text-secondary break-all">{reviewLink}</p>
            </div>
            <button
              onClick={copyLink}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold text-sm transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
            <p className="text-center text-xs text-text-faint">
              Share this link with the customer via text or email.
            </p>
            <button onClick={onClose} className="w-full text-sm text-text-faint hover:text-text-primary transition-colors py-1">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TradeDeskTab({
  supplier,
  manufacturers,
  accessToken,
  slug,
  origin,
}: {
  supplier: SupplierData
  manufacturers: Manufacturer[]
  accessToken: string
  slug: string
  origin: string
}) {
  const [query, setQuery]                       = useState('')
  const [quotePrepItems, setQuotePrepItems]     = useState<QuotePrepItem[]>([])
  const [reviewModalItems, setReviewModalItems] = useState<StockedItem[]>([])
  const [showReviewModal, setShowReviewModal]   = useState(false)
  const [selectedForReview, setSelectedForReview] = useState<Set<string>>(new Set())

  // Build stocked items by cross-referencing selected system IDs with full manufacturer data
  const stockedItems = useMemo<StockedItem[]>(() => {
    const selectedIds = new Set(
      supplier.embed_widgets.flatMap(w => w.embed_widget_systems.map(ews => ews.system_id))
    )
    const items: StockedItem[] = []
    for (const mf of manufacturers) {
      for (const sys of mf.systems) {
        if (selectedIds.has(sys.id)) {
          items.push({
            systemId:          sys.id,
            systemName:        sys.name,
            productCode:       sys.product_code,
            category:          sys.category,
            subcategory:       sys.subcategory ?? null,
            description:       sys.description ?? null,
            dimensions:        sys.dimensions ?? null,
            manufacturerId:    mf.id,
            manufacturerName:  mf.name,
            manufacturerWebsite: mf.website_url ?? null,
            systemWebsite:     sys.website_url ?? null,
          })
        }
      }
    }
    return items.sort((a, b) =>
      a.manufacturerName.localeCompare(b.manufacturerName) || a.systemName.localeCompare(b.systemName)
    )
  }, [supplier, manufacturers])

  const results = useMemo(() => searchItems(stockedItems, query), [stockedItems, query])

  const addedSystemIds = new Set(quotePrepItems.map(p => p.systemId))

  function addToQuotePrep(item: StockedItem) {
    if (addedSystemIds.has(item.systemId)) return
    setQuotePrepItems(prev => [...prev, {
      localId:      crypto.randomUUID(),
      systemId:     item.systemId,
      systemName:   item.systemName,
      manufacturer: item.manufacturerName,
      productCode:  item.productCode,
      dimensions:   item.dimensions,
      qty:          1,
      uom:          '',
      notes:        '',
    }])
  }

  function toggleSelectForReview(item: StockedItem) {
    setSelectedForReview(prev => {
      const next = new Set(prev)
      next.has(item.systemId) ? next.delete(item.systemId) : next.add(item.systemId)
      return next
    })
  }

  function openReviewModal(item: StockedItem) {
    setReviewModalItems([item])
    setShowReviewModal(true)
  }

  function openReviewModalForSelected() {
    const items = results.filter(r => selectedForReview.has(r.systemId))
    if (items.length === 0) return
    setReviewModalItems(items)
    setShowReviewModal(true)
  }

  function openReviewModalForQuotePrep() {
    const items = quotePrepItems
      .map(qp => stockedItems.find(s => s.systemId === qp.systemId))
      .filter((s): s is StockedItem => !!s)
    if (items.length === 0) return
    setReviewModalItems(items)
    setShowReviewModal(true)
  }

  const EXAMPLES = [
    '820 flush internal door',
    'vertical fibre cement cladding',
    'blackbutt composite decking',
    'external corner trim',
  ]

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h2 className="text-lg font-bold text-text-primary">Trade Desk Search</h2>
        <p className="text-text-faint text-sm mt-1">
          Search your stocked ranges, add confirmed items to quote prep, or send a customer review link.
        </p>
      </div>

      {/* ── Search input ── */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search stocked products…"
          autoFocus
          className="w-full bg-ui border border-border rounded-xl px-5 py-4 text-text-primary placeholder-text-faint text-base focus:outline-none focus:border-brand transition-colors pr-12"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Example chips */}
      {!query && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-text-faint">Try:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setQuery(ex)}
              className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border rounded-full text-text-secondary transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* ── Two-column layout: results + quote prep ── */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 space-y-5 lg:space-y-0">

        {/* Results */}
        <div className="space-y-3">
          {query && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-text-faint">
                {results.length > 0
                  ? `${results.length} suggested stocked match${results.length !== 1 ? 'es' : ''} — confirm with customer before adding`
                  : `No matches in your stocked ranges for "${query}"`}
              </p>
              {selectedForReview.size > 0 && (
                <button
                  onClick={openReviewModalForSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Send review link — {selectedForReview.size} selected
                </button>
              )}
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map(item => (
                <ResultCard
                  key={item.systemId}
                  item={item}
                  onAddToQuotePrep={addToQuotePrep}
                  onSendReviewLink={openReviewModal}
                  onToggleSelect={toggleSelectForReview}
                  alreadyAdded={addedSystemIds.has(item.systemId)}
                  selected={selectedForReview.has(item.systemId)}
                />
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="py-12 text-center border border-border-subtle rounded-xl">
              <p className="text-text-faint text-sm">No stocked products match "{query}"</p>
              <p className="text-text-faint text-xs mt-1.5">
                Try different keywords, or go to the Products tab to add more stocked ranges.
              </p>
            </div>
          )}

          {!query && stockedItems.length > 0 && (
            <div className="py-12 text-center border border-border-subtle rounded-xl">
              <p className="text-text-secondary text-sm font-medium">
                {stockedItems.length} stocked product{stockedItems.length !== 1 ? 's' : ''} ready to search
              </p>
              <p className="text-text-faint text-xs mt-1">Start typing above to find matches.</p>
            </div>
          )}

          {!query && stockedItems.length === 0 && (
            <div className="py-12 text-center border border-border-subtle rounded-xl">
              <p className="text-text-faint text-sm">No stocked products configured yet.</p>
              <p className="text-text-faint text-xs mt-1.5">
                Go to the Products tab and add the manufacturers you stock.
              </p>
            </div>
          )}
        </div>

        {/* Quote prep panel */}
        <div className="lg:sticky lg:top-24 self-start">
          <QuotePrepPanel
            items={quotePrepItems}
            onUpdateQty={(id, qty) =>
              setQuotePrepItems(prev => prev.map(p => p.localId === id ? { ...p, qty } : p))
            }
            onUpdateUom={(id, uom) =>
              setQuotePrepItems(prev => prev.map(p => p.localId === id ? { ...p, uom } : p))
            }
            onUpdateNotes={(id, notes) =>
              setQuotePrepItems(prev => prev.map(p => p.localId === id ? { ...p, notes } : p))
            }
            onRemove={id => setQuotePrepItems(prev => prev.filter(p => p.localId !== id))}
            onClear={() => setQuotePrepItems([])}
            onSendReviewLink={openReviewModalForQuotePrep}
          />
        </div>
      </div>

      {/* Send review link modal */}
      {showReviewModal && (
        <SendReviewLinkModal
          items={reviewModalItems}
          supplierSlug={slug}
          supplierName={supplier.name}
          accessToken={accessToken}
          origin={origin}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  )
}
