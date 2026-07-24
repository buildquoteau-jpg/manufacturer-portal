'use client'

import { useState, useMemo, useEffect } from 'react'
import { SupplierData, Manufacturer } from './shared'
import { fuzzyIncludes } from '@/lib/fuzzyMatch'
import { CATEGORY_COLOURS } from '@/components/system-card/SystemCardTile'
import { SystemCardTile } from '@/components/system-card/SystemCardTile'
import { SystemCardRenderer } from '@/components/system-card/SystemCardRenderer'
import { ShoppingListProvider, useShoppingList } from '@/components/system-card/ShoppingListProvider'
import { ShoppingListDrawer } from '@/components/system-card/ShoppingListDrawer'
import { adaptProductionSystem } from '@/components/system-card/adaptProductionSystem'
import type { SystemCardSystem } from '@/components/system-card/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CrossSellRule = {
  from_category: string
  to_category: string
}

type ManufacturerGroup = {
  manufacturerSlug: string
  manufacturerName: string
  items: SystemCardSystem[]
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
  description: 2,
} as const

function searchItemsScored(items: SystemCardSystem[], query: string): { item: SystemCardSystem; score: number }[] {
  const q = query.trim()
  if (!q) return []
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const fieldsOf = (item: SystemCardSystem) => [
    { text: item.name, weight: FIELD_WEIGHT.name },
    { text: item.product_code ?? '', weight: FIELD_WEIGHT.productCode },
    { text: [item.category, item.subcategory ?? ''].join(' '), weight: FIELD_WEIGHT.category },
    { text: item.manufacturer?.name ?? '', weight: FIELD_WEIGHT.manufacturer },
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
  items: SystemCardSystem[],
  scoreOf: (item: SystemCardSystem) => number = () => 0,
): ManufacturerGroup[] {
  const map = new Map<string, ManufacturerGroup>()
  for (const item of items) {
    const mfSlug = item.manufacturer?.slug ?? 'unknown'
    const score = scoreOf(item)
    let g = map.get(mfSlug)
    if (!g) {
      g = {
        manufacturerSlug: mfSlug,
        manufacturerName: item.manufacturer?.name ?? 'Unknown manufacturer',
        items: [],
        bestScore: score,
      }
      map.set(mfSlug, g)
    }
    g.items.push(item)
    if (score > g.bestScore) g.bestScore = score
  }
  return [...map.values()].sort((a, b) =>
    b.bestScore - a.bestScore || b.items.length - a.items.length || a.manufacturerName.localeCompare(b.manufacturerName)
  )
}

// ── Manufacturer group card ──────────────────────────────────────────────────

function ManufacturerGroupCard({
  group,
  onDrillDown,
}: {
  group: ManufacturerGroup
  onDrillDown: (manufacturerSlug: string) => void
}) {
  return (
    <button
      onClick={() => onDrillDown(group.manufacturerSlug)}
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
          <p key={item.id} className="text-xs text-text-secondary truncate">{item.name}</p>
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
  stockedSystems,
  onSelectCategory,
}: {
  categories: string[]
  stockedSystems: SystemCardSystem[]
  onSelectCategory: (category: string) => void
}) {
  const withCounts = categories
    .map(cat => ({ cat, count: stockedSystems.filter(i => i.category === cat).length }))
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

// ── Result tile with a select-for-review overlay ──────────────────────────────
// The overlay checkbox is layered around the master SystemCardTile rather
// than added into that file, so the ported component stays byte-close to the
// v6 / Data Studio source.

function SelectableTile({
  system,
  onOpen,
  onToggleSelect,
  selected,
}: {
  system: SystemCardSystem
  onOpen: () => void
  onToggleSelect: () => void
  selected: boolean
}) {
  return (
    <div className="relative">
      <SystemCardTile system={system} onClick={onOpen} />
      <button
        onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleSelect() }}
        title={selected ? 'Deselect for review link' : 'Select for review link'}
        className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected ? 'bg-brand border-brand' : 'bg-white/90 border-white hover:border-brand'
        }`}
      >
        {selected && <span className="text-white text-xs font-bold leading-none">✓</span>}
      </button>
    </div>
  )
}

// ── System detail modal ───────────────────────────────────────────────────────

function SystemDetailModal({
  system,
  onClose,
  onSendReviewLink,
}: {
  system: SystemCardSystem
  onClose: () => void
  onSendReviewLink: () => void
}) {
  const { addItems } = useShoppingList()

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl my-8">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onSendReviewLink}
            className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-secondary text-xs font-semibold rounded-lg transition-colors"
          >
            Send review link for this product
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface border border-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xl leading-none">×</button>
        </div>
        <SystemCardRenderer
          system={system}
          showStockists={false}
          onAddToList={addItems}
        />
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
  items: SystemCardSystem[]
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
        systemIds: items.map(i => i.id),
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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
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
                <p key={item.id} className="text-xs text-text-secondary">
                  <span className="text-text-muted">{item.manufacturer?.name ?? ''}</span> · {item.name}
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

export function TradeDeskTab(props: {
  supplier: SupplierData
  manufacturers: Manufacturer[]
  accessToken: string
  slug: string
  origin: string
  crossSellRules: CrossSellRule[]
}) {
  return (
    <ShoppingListProvider storageKey={`bq-trade-desk-list-${props.slug}`}>
      <TradeDeskInner {...props} />
    </ShoppingListProvider>
  )
}

function TradeDeskInner({
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
  const [detailSystem, setDetailSystem]         = useState<SystemCardSystem | null>(null)
  const [reviewModalItems, setReviewModalItems] = useState<SystemCardSystem[]>([])
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

  // Build the master System Card list by cross-referencing stocked system IDs
  // with the full manufacturer/system data (same shape the public widget reads).
  const stockedSystems = useMemo<SystemCardSystem[]>(() => {
    const selectedIds = new Set(
      supplier.embed_widgets.flatMap(w => w.embed_widget_systems.map(ews => ews.system_id))
    )
    const items: SystemCardSystem[] = []
    for (const mf of manufacturers) {
      for (const sys of mf.systems) {
        if (selectedIds.has(sys.id)) {
          items.push(adaptProductionSystem(sys, { name: mf.name, slug: mf.slug, logo_url: mf.logo_url }))
        }
      }
    }
    return items.sort((a, b) =>
      (a.manufacturer?.name ?? '').localeCompare(b.manufacturer?.name ?? '') || a.name.localeCompare(b.name)
    )
  }, [supplier, manufacturers])

  const scoredResults = useMemo(() => searchItemsScored(stockedSystems, query), [stockedSystems, query])
  const results = useMemo(() => scoredResults.map(r => r.item), [scoredResults])

  const scoreMap = useMemo(
    () => new Map(scoredResults.map(r => [r.item.id, r.score])),
    [scoredResults]
  )
  const manufacturerGroups = useMemo(
    () => groupByManufacturer(results, item => scoreMap.get(item.id) ?? 0),
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
    if (categoryBrowse) return stockedSystems.filter(i => i.category === categoryBrowse)
    if (manufacturerFilter) return results.filter(i => i.manufacturer?.slug === manufacturerFilter)
    return results
  }, [categoryBrowse, manufacturerFilter, results, stockedSystems])

  function toggleSelectForReview(item: SystemCardSystem) {
    setSelectedForReview(prev => {
      const next = new Set(prev)
      next.has(item.id) ? next.delete(item.id) : next.add(item.id)
      return next
    })
  }

  function openReviewModal(item: SystemCardSystem) {
    setReviewModalItems([item])
    setShowReviewModal(true)
  }

  function openReviewModalForSelected() {
    const items = (categoryBrowse ? displayedItems : results).filter(r => selectedForReview.has(r.id))
    if (items.length === 0) return
    setReviewModalItems(items)
    setShowReviewModal(true)
  }

  function drillIntoManufacturer(manufacturerSlug: string) {
    setManufacturerFilter(manufacturerSlug)
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
    <div className="space-y-5 pb-16">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-bold text-brand">Trade Desk Search</h2>
        <p className="text-text-secondary text-sm mt-1">
          Search your stocked ranges, open a product to add items to the shopping list, or send a customer review link.
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

      {/* ── Results ── */}
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
            stockedSystems={stockedSystems}
            onSelectCategory={setCategoryBrowse}
          />
        )}

        {!categoryBrowse && manufacturerFilter && !showManufacturerGrid && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-text-secondary">
              Filtered to <span className="text-text-primary font-semibold">
                {stockedSystems.find(i => i.manufacturer?.slug === manufacturerFilter)?.manufacturer?.name}
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
              <ManufacturerGroupCard key={group.manufacturerSlug} group={group} onDrillDown={drillIntoManufacturer} />
            ))}
          </div>
        ) : (
          <>
            {displayedItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedItems.map(item => (
                  <SelectableTile
                    key={item.id}
                    system={item}
                    onOpen={() => setDetailSystem(item)}
                    onToggleSelect={() => toggleSelectForReview(item)}
                    selected={selectedForReview.has(item.id)}
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

            {!categoryBrowse && !query && stockedSystems.length > 0 && (
              <div className="py-12 text-center border border-border-subtle rounded-xl">
                <p className="text-text-secondary text-sm font-semibold">
                  {stockedSystems.length} stocked product{stockedSystems.length !== 1 ? 's' : ''} ready to search
                </p>
                <p className="text-text-muted text-xs mt-1">Start typing above to find matches.</p>
              </div>
            )}

            {!categoryBrowse && !query && stockedSystems.length === 0 && (
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

      {/* System detail — full master System Card, same rendering as the
          public widget/library, minus the local-stockist section (staff at
          the desk ARE the stockist) */}
      {detailSystem && (
        <SystemDetailModal
          system={detailSystem}
          onClose={() => setDetailSystem(null)}
          onSendReviewLink={() => { openReviewModal(detailSystem); }}
        />
      )}

      {/* Floating shopping-list bar — appears once staff add items from a
          product's detail card */}
      <ShoppingListDrawer />

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
