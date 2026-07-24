'use client'

import { useState, useMemo, useEffect } from 'react'
import { SupplierData, Manufacturer } from './shared'
import { fuzzyIncludes } from '@/lib/fuzzyMatch'
import { CATEGORY_COLOURS } from '@/components/ui/SystemCardTile'

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

export type CrossSellRule = {
  from_category: string
  to_category: string
}

type ManufacturerGroup = {
  manufacturerId: string
  manufacturerName: string
  manufacturerWebsite: string | null
  items: StockedItem[]
  bestScore: number
}

type Channel = 'email' | 'sms' | 'whatsapp'
type MessagingStatus = { sms: boolean; whatsapp: boolean }
type DeliveryResult = { sent: boolean; reason?: string; error?: string }

function channelLabel(c: Channel) {
  return c === 'email' ? 'Email' : c === 'sms' ? 'SMS' : 'WhatsApp'
}

function categoryStyle(category: string) {
  return CATEGORY_COLOURS[category] ?? { bg: '#f3f4f6', color: '#374151' }
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

function searchItemsScored(items: StockedItem[], query: string): { item: StockedItem; score: number }[] {
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

  return scored
}

// A manufacturer's rank = its single best-scoring matching product (ties
// broken by match count, then name) — one excellent match should outrank a
// manufacturer with several mediocre ones.
function groupByManufacturer(
  items: StockedItem[],
  scoreOf: (item: StockedItem) => number = () => 0,
): ManufacturerGroup[] {
  const map = new Map<string, ManufacturerGroup>()
  for (const item of items) {
    const score = scoreOf(item)
    let g = map.get(item.manufacturerId)
    if (!g) {
      g = {
        manufacturerId: item.manufacturerId,
        manufacturerName: item.manufacturerName,
        manufacturerWebsite: item.manufacturerWebsite,
        items: [],
        bestScore: score,
      }
      map.set(item.manufacturerId, g)
    }
    g.items.push(item)
    if (score > g.bestScore) g.bestScore = score
  }
  return [...map.values()].sort((a, b) =>
    b.bestScore - a.bestScore || b.items.length - a.items.length || a.manufacturerName.localeCompare(b.manufacturerName)
  )
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
  const catStyle = categoryStyle(item.category)

  return (
    <div className={`bg-surface border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all ${selected ? 'border-brand' : 'border-border hover:border-brand/50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm leading-snug" style={{ wordBreak: 'break-word' }}>
            {item.systemName}
          </p>
          <p className="text-text-secondary text-xs mt-0.5 font-medium">{item.manufacturerName}</p>
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

      <div className="space-y-1">
        {item.productCode && (
          <p className="font-mono text-xs text-text-secondary">
            <span className="text-text-muted">SKU</span> {item.productCode}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: catStyle.bg, color: catStyle.color }}
          >
            {item.category}
          </span>
          {item.subcategory && <span className="text-xs text-text-secondary">{item.subcategory}</span>}
        </div>
        {item.dimensions && (
          <p className="text-xs text-text-secondary">{item.dimensions}</p>
        )}
        {item.description && (
          <p className="text-xs text-text-muted line-clamp-2 mt-1">{item.description}</p>
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
          className="flex-1 min-w-[130px] py-2 bg-ui hover:bg-surface-hover border border-border text-text-secondary text-xs font-semibold rounded-lg transition-colors"
        >
          Send review link
        </button>
        {website && (
          <a
            href={website} target="_blank" rel="noopener noreferrer"
            className="w-full py-1.5 text-center text-xs text-brand hover:underline font-semibold transition-colors"
          >
            View manufacturer website ↗
          </a>
        )}
      </div>
    </div>
  )
}

// ── Manufacturer group card ──────────────────────────────────────────────────

function ManufacturerGroupCard({
  group,
  onDrillDown,
}: {
  group: ManufacturerGroup
  onDrillDown: (manufacturerId: string) => void
}) {
  return (
    <button
      onClick={() => onDrillDown(group.manufacturerId)}
      className="bg-surface border border-border hover:border-brand rounded-xl p-4 flex flex-col gap-2.5 text-left shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-text-primary text-sm leading-snug">{group.manufacturerName}</p>
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-subtle text-brand font-medium flex-shrink-0">
          {group.items.length} match{group.items.length !== 1 ? 'es' : ''}
        </span>
      </div>
      <div className="space-y-0.5">
        {group.items.slice(0, 3).map(item => (
          <p key={item.systemId} className="text-xs text-text-secondary truncate">{item.systemName}</p>
        ))}
        {group.items.length > 3 && (
          <p className="text-xs text-text-muted">+{group.items.length - 3} more</p>
        )}
      </div>
      <span className="text-xs text-brand font-semibold mt-1">View products →</span>
    </button>
  )
}

// ── Cross-sell strip ─────────────────────────────────────────────────────────

function CrossSellStrip({
  categories,
  stockedItems,
  onSelectCategory,
}: {
  categories: string[]
  stockedItems: StockedItem[]
  onSelectCategory: (category: string) => void
}) {
  const withCounts = categories
    .map(cat => ({ cat, count: stockedItems.filter(i => i.category === cat).length }))
    .filter(c => c.count > 0)

  if (withCounts.length === 0) return null

  return (
    <div className="bg-ui border border-border rounded-xl p-4">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2.5">
        You may also be interested in
      </p>
      <div className="flex flex-wrap gap-2">
        {withCounts.map(({ cat, count }) => {
          const style = categoryStyle(cat)
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-opacity hover:opacity-80"
              style={{ background: style.bg, color: style.color }}
            >
              {cat} <span style={{ opacity: 0.65 }}>({count})</span>
            </button>
          )
        })}
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
        <p className="text-text-muted text-xs mt-1.5 leading-relaxed">
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
        <button onClick={onClear} className="text-xs text-text-muted hover:text-error font-medium transition-colors">
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
                <p className="text-xs text-text-secondary mt-0.5">
                  {item.manufacturer}
                  {item.productCode && (
                    <span className="font-mono ml-2 text-text-muted">{item.productCode}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onRemove(item.localId)}
                className="text-text-muted hover:text-error text-lg leading-none mt-0.5 flex-shrink-0 transition-colors"
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
          className="w-full py-2 bg-ui hover:bg-surface-hover border border-border text-text-secondary text-xs font-semibold rounded-lg transition-colors"
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
  accessToken,
  origin,
  messagingStatus,
  onClose,
}: {
  items: StockedItem[]
  supplierSlug: string
  supplierName: string
  accessToken: string
  origin: string
  messagingStatus: MessagingStatus
  onClose: () => void
}) {
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile]             = useState('')
  const [email, setEmail]               = useState('')
  const [note, setNote]                 = useState('')
  const [channel, setChannel]           = useState<Channel>('email')
  const [creating, setCreating]         = useState(false)
  const [reviewLink, setReviewLink]     = useState<string | null>(null)
  const [delivery, setDelivery]         = useState<DeliveryResult | null>(null)
  const [sentChannel, setSentChannel]   = useState<Channel>('email')
  const [error, setError]               = useState('')
  const [copied, setCopied]             = useState(false)

  const channelOptions: { id: Channel; available: boolean; needsMobile: boolean }[] = [
    { id: 'email',    available: true,                    needsMobile: false },
    { id: 'sms',      available: messagingStatus.sms,      needsMobile: true },
    { id: 'whatsapp', available: messagingStatus.whatsapp, needsMobile: true },
  ]
  const selected = channelOptions.find(c => c.id === channel)!
  const missingField = selected.needsMobile ? !mobile.trim() : !email.trim()

  async function handleCreate() {
    if (missingField) {
      setError(selected.needsMobile ? 'Enter a mobile number for this channel.' : 'Enter an email address for this channel.')
      return
    }
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
        channel,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed to create link'); setCreating(false); return }
    setReviewLink(`${origin}/supplier-review/${json.token}`)
    setDelivery(json.delivery ?? null)
    setSentChannel(json.channel ?? channel)
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
            <p className="text-xs text-text-secondary mt-0.5">
              {items.length} product{items.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl px-1 leading-none">×</button>
        </div>

        {!reviewLink ? (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-ui rounded-lg px-3 py-2.5 space-y-1">
              {items.map(item => (
                <p key={item.systemId} className="text-xs text-text-secondary">
                  <span className="text-text-muted">{item.manufacturerName}</span> · {item.systemName}
                </p>
              ))}
            </div>

            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Customer details</p>
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

            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Send via</p>
              <div className="grid grid-cols-3 gap-2">
                {channelOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => opt.available && setChannel(opt.id)}
                    disabled={!opt.available}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      channel === opt.id && opt.available
                        ? 'bg-brand border-brand text-white'
                        : opt.available
                          ? 'bg-ui border-border text-text-secondary hover:border-brand'
                          : 'bg-ui border-border-subtle text-text-faint opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {channelLabel(opt.id)}
                    {!opt.available && <span className="block text-[10px] font-normal mt-0.5">Not configured</span>}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-error text-xs">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {creating ? 'Sending…' : `Send via ${channelLabel(channel)}`}
              </button>
              <button onClick={onClose} className="text-sm text-text-secondary hover:text-text-primary font-medium transition-colors px-2">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-brand-subtle border border-brand/30 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-brand uppercase tracking-widest">Review link ready</p>
              {delivery?.sent && (
                <p className="text-xs text-success font-medium">✓ Sent via {channelLabel(sentChannel)}</p>
              )}
              {delivery && !delivery.sent && delivery.reason === 'not_configured' && (
                <p className="text-xs text-text-muted">
                  {channelLabel(sentChannel)} isn&apos;t set up yet — link copied below, share it manually.
                </p>
              )}
              {delivery && !delivery.sent && delivery.reason !== 'not_configured' && (
                <p className="text-xs text-error">
                  Delivery failed — link copied below, share it manually.
                </p>
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
              Or copy the link above and share it another way.
            </p>
            <button onClick={onClose} className="w-full text-sm text-text-secondary hover:text-text-primary font-medium transition-colors py-1">
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
  crossSellRules,
}: {
  supplier: SupplierData
  manufacturers: Manufacturer[]
  accessToken: string
  slug: string
  origin: string
  crossSellRules: CrossSellRule[]
}) {
  const [query, setQuery]                       = useState('')
  const [view, setView]                         = useState<'product' | 'manufacturer'>('product')
  const [manufacturerFilter, setManufacturerFilter] = useState<string | null>(null)
  const [categoryBrowse, setCategoryBrowse]     = useState<string | null>(null)
  const [quotePrepItems, setQuotePrepItems]     = useState<QuotePrepItem[]>([])
  const [reviewModalItems, setReviewModalItems] = useState<StockedItem[]>([])
  const [showReviewModal, setShowReviewModal]   = useState(false)
  const [selectedForReview, setSelectedForReview] = useState<Set<string>>(new Set())
  const [msgStatus, setMsgStatus]               = useState<MessagingStatus>({ sms: false, whatsapp: false })

  useEffect(() => {
    fetch('/api/supplier/messaging-status')
      .then(r => r.json())
      .then(setMsgStatus)
      .catch(() => {})
  }, [])

  // A fresh search should drop any drill-down/adjacent-category context from
  // the previous one. Adjusted during render (React's documented pattern for
  // resetting state when another value changes) rather than in an effect.
  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setManufacturerFilter(null)
    setCategoryBrowse(null)
  }

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

  const scoredResults = useMemo(() => searchItemsScored(stockedItems, query), [stockedItems, query])
  const results = useMemo(() => scoredResults.map(r => r.item), [scoredResults])

  const scoreMap = useMemo(
    () => new Map(scoredResults.map(r => [r.item.systemId, r.score])),
    [scoredResults]
  )
  const manufacturerGroups = useMemo(
    () => groupByManufacturer(results, item => scoreMap.get(item.systemId) ?? 0),
    [results, scoreMap]
  )

  const crossSellCategories = useMemo(() => {
    const topCategory = scoredResults[0]?.item.category
    if (!topCategory) return []
    const targets = crossSellRules
      .filter(r => r.from_category === topCategory)
      .map(r => r.to_category)
    return Array.from(new Set(targets))
  }, [scoredResults, crossSellRules])

  const displayedItems = useMemo(() => {
    if (categoryBrowse) return stockedItems.filter(i => i.category === categoryBrowse)
    if (manufacturerFilter) return results.filter(i => i.manufacturerId === manufacturerFilter)
    return results
  }, [categoryBrowse, manufacturerFilter, results, stockedItems])

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
    const items = (categoryBrowse ? displayedItems : results).filter(r => selectedForReview.has(r.systemId))
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

  function drillIntoManufacturer(manufacturerId: string) {
    setManufacturerFilter(manufacturerId)
    setView('product')
  }

  const EXAMPLES = [
    '820 flush internal door',
    'vertical fibre cement cladding',
    'blackbutt composite decking',
    'external corner trim',
  ]

  const showManufacturerGrid = view === 'manufacturer' && !!query && !categoryBrowse && results.length > 0

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-bold text-brand">Trade Desk Search</h2>
        <p className="text-text-secondary text-sm mt-1">
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
          className="w-full bg-ui border border-border rounded-xl px-5 py-4 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors pr-12"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xl leading-none"
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
              className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border hover:border-brand rounded-full text-text-secondary font-medium transition-colors"
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
          {categoryBrowse ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-text-secondary">
                Showing <span className="text-text-primary font-semibold">{categoryBrowse}</span> — adjacent to your search
              </p>
              <div className="flex items-center gap-3">
                {selectedForReview.size > 0 && (
                  <button
                    onClick={openReviewModalForSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Send review link — {selectedForReview.size} selected
                  </button>
                )}
                <button onClick={() => setCategoryBrowse(null)} className="text-xs text-brand hover:underline font-semibold transition-colors">
                  × Clear
                </button>
              </div>
            </div>
          ) : query && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xs text-text-primary font-semibold">
                  {results.length > 0
                    ? `${results.length} suggested stocked match${results.length !== 1 ? 'es' : ''} — confirm with customer before adding`
                    : `No matches in your stocked ranges for "${query}"`}
                </p>
                {results.length > 0 && (
                  <div className="flex items-center rounded-lg border border-border overflow-hidden flex-shrink-0">
                    <button
                      onClick={() => setView('product')}
                      className={`px-3 py-1 text-xs font-semibold transition-colors ${view === 'product' ? 'bg-brand text-white' : 'bg-ui text-text-secondary hover:text-brand'}`}
                    >
                      Products
                    </button>
                    <button
                      onClick={() => setView('manufacturer')}
                      className={`px-3 py-1 text-xs font-semibold transition-colors ${view === 'manufacturer' ? 'bg-brand text-white' : 'bg-ui text-text-secondary hover:text-brand'}`}
                    >
                      Manufacturers
                    </button>
                  </div>
                )}
              </div>
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

          {!categoryBrowse && query && results.length > 0 && (
            <CrossSellStrip
              categories={crossSellCategories}
              stockedItems={stockedItems}
              onSelectCategory={setCategoryBrowse}
            />
          )}

          {!categoryBrowse && manufacturerFilter && !showManufacturerGrid && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-secondary">
                Filtered to <span className="text-text-primary font-semibold">
                  {stockedItems.find(i => i.manufacturerId === manufacturerFilter)?.manufacturerName}
                </span>
              </p>
              <button onClick={() => setManufacturerFilter(null)} className="text-xs text-brand hover:underline font-semibold">
                × clear
              </button>
            </div>
          )}

          {showManufacturerGrid ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {manufacturerGroups.map(group => (
                <ManufacturerGroupCard key={group.manufacturerId} group={group} onDrillDown={drillIntoManufacturer} />
              ))}
            </div>
          ) : (
            <>
              {displayedItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayedItems.map(item => (
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

              {!categoryBrowse && query && results.length === 0 && (
                <div className="py-12 text-center border border-border-subtle rounded-xl">
                  <p className="text-text-secondary text-sm font-semibold">No stocked products match &quot;{query}&quot;</p>
                  <p className="text-text-muted text-xs mt-1.5">
                    Try different keywords, or go to the Products tab to add more stocked ranges.
                  </p>
                </div>
              )}

              {!categoryBrowse && !query && stockedItems.length > 0 && (
                <div className="py-12 text-center border border-border-subtle rounded-xl">
                  <p className="text-text-secondary text-sm font-semibold">
                    {stockedItems.length} stocked product{stockedItems.length !== 1 ? 's' : ''} ready to search
                  </p>
                  <p className="text-text-muted text-xs mt-1">Start typing above to find matches.</p>
                </div>
              )}

              {!categoryBrowse && !query && stockedItems.length === 0 && (
                <div className="py-12 text-center border border-border-subtle rounded-xl">
                  <p className="text-text-secondary text-sm font-semibold">No stocked products configured yet.</p>
                  <p className="text-text-muted text-xs mt-1.5">
                    Go to the Products tab and add the manufacturers you stock.
                  </p>
                </div>
              )}
            </>
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
          messagingStatus={msgStatus}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  )
}
