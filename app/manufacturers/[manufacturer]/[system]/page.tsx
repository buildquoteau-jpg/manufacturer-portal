'use client'
import { useMemo, useState, use } from 'react'
import manufacturersData from '@/data/manufacturers.json'
import SystemCard from '@/components/ui/SystemCard'

type Item = {
  code: string
  name: string
  length?: number | null
  width?: number | null
  thickness?: number | null
  texture?: string
  uom: string
  qty: number
  checked: boolean
}

function buildItems(system: any): Item[] {
  const panels = (system.panels || []).map((p: any) => ({ ...p, qty: 0, checked: false }))
  const accessories = (system.accessories || []).map((a: any) => ({ ...a, qty: 0, checked: false }))
  return [...panels, ...accessories]
}

function formatDimensions(item: any) {
  if (item.length && item.width && item.thickness) return `${item.length} × ${item.width} × ${item.thickness} mm`
  if (item.length && item.width) return `${item.length} × ${item.width} mm`
  if (item.length && item.thickness) return `${item.length} × ${item.thickness} mm`
  if (item.length) return `${item.length} mm`
  return '—'
}

export default function SystemPage({ params }: { params: Promise<{ manufacturer: string; system: string }> }) {
  const { manufacturer: mfrSlug, system: systemSlug } = use(params)
  const mfr = (manufacturersData as any[]).find(m => m.slug === mfrSlug)
  const system = mfr?.systems.find((s: any) => s.slug === systemSlug)

  const [items, setItems] = useState<Item[]>(() => (system ? buildItems(system) : []))

  const panels = useMemo(
    () => items.filter(i => system?.panels?.some((p: any) => p.code === i.code)),
    [items, system]
  )
  const accessories = useMemo(
    () => items.filter(i => system?.accessories?.some((a: any) => a.code === i.code)),
    [items, system]
  )
  const selectedCount = items.filter(i => i.qty > 0).length
  const panelCount = panels.length
  const accessoryCount = accessories.length

  if (!system || !mfr) {
    return (
      <div className="min-h-screen bg-page px-4 py-12 text-text-primary">
        <p className="text-lg">System not found.</p>
        <a href="/manufacturers" className="mt-4 inline-block text-brand">
          ← Back to manufacturers
        </a>
      </div>
    )
  }

  function setQty(code: string, qty: number) {
    setItems(prev =>
      prev.map(i =>
        i.code === code
          ? { ...i, qty: Math.max(0, qty), checked: Math.max(0, qty) > 0 }
          : i
      )
    )
  }

  function exportBuildQuoteItems() {
    const selected = items.filter(i => i.qty > 0)
    if (selected.length === 0) return

    const lineItems = selected.map(i => ({
      id: crypto.randomUUID(),
      name: i.name,
      sku: i.code,
      productId: '',
      desc: formatDimensions(i) === '—' ? '' : formatDimensions(i),
      uom: i.uom,
      qty: String(i.qty),
    }))

    const blob = new Blob([JSON.stringify(lineItems, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mfr.slug}-${system.slug}-buildquote-items.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="min-h-screen bg-page text-text-primary">
      <nav className="sticky top-0 z-30 border-b border-border bg-page/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <button
            className="text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-brand"
            onClick={() => window.history.back()}
          >
            ← {mfr.name}
          </button>
          <a href="/" className="text-sm font-bold tracking-[0.2em]">
            BUILD<span className="text-brand">QUOTE</span>
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
            {mfr.name} · {system.application}
          </p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-none md:text-6xl">
            {system.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
            {system.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
              Panels: {panelCount}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
              Accessories: {accessoryCount}
            </span>
            {system.thickness && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                Thickness: {system.thickness}
              </span>
            )}
            {system.warranty && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                Warranty: {system.warranty}
              </span>
            )}
          </div>

          <a
            href={mfr.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-brand transition-colors hover:text-brand-hover"
          >
            View on {mfr.name} website ↗
          </a>
        </section>

        <section className="mt-6 max-w-3xl rounded-2xl border border-sand/35 bg-sand/5 p-4">
          <div className="flex gap-3">
            <span className="pt-0.5 text-sand">⚠</span>
            <p className="text-sm leading-relaxed text-text-secondary">
              Component cards are compiled using AI and publicly available manufacturer data.
              Always verify product codes, specifications and compatibility on the manufacturer website
              before placing your order.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_280px]">
          <SystemCard
            title={system.name}
            subtitle="Choose panel sizes and accessories for this system. SKU, UOM and item dimensions are shown in each row."
            panels={panels}
            accessories={accessories}
            onQtyChange={setQty}
          />

          <aside className="xl:sticky xl:top-24">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Selection</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{selectedCount}</p>
              <p className="text-sm text-text-secondary">
                {selectedCount === 1 ? 'item ready' : 'items ready'} for BuildQuote
              </p>

              <button
                className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  selectedCount === 0
                    ? 'cursor-not-allowed border border-border bg-ui text-text-faint'
                    : 'bg-brand text-page hover:bg-brand-hover'
                }`}
                onClick={exportBuildQuoteItems}
                disabled={selectedCount === 0}
              >
                {selectedCount === 0 ? 'Select items first' : '⬇ Export BuildQuote Items'}
              </button>

              <p className="mt-3 text-xs leading-relaxed text-text-faint">
                Select the items you want here. You can export them into BuildQuote now and still adjust quantities later in BuildQuote before sending your RFQ.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
