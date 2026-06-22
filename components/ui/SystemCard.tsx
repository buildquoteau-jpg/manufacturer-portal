'use client'

import { useState } from 'react'

type Item = {
  code: string
  name: string
  length?: number | null
  width?: number | null
  thickness?: number | null
  texture?: string | null
  uom: string
  qty: number
  checked: boolean
}

type VerificationStatus =
  | 'ai_pass'
  | 'buildquote_checked'
  | 'manufacturer_verified'
  | string
  | null
  | undefined

type PanelGroup = {
  key: string
  label: string
  items: Item[]
}

function groupPanels(panels: Item[]): { groups: PanelGroup[]; ungrouped: Item[] } {
  const map = new Map<string, Item[]>()
  const ungrouped: Item[] = []

  for (const item of panels) {
    if (item.thickness != null || item.width != null) {
      const key = `${item.thickness ?? 0}__${item.width ?? 0}__${item.texture ?? ''}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    } else {
      ungrouped.push(item)
    }
  }

  const groups: PanelGroup[] = []
  for (const items of map.values()) {
    if (items.length === 1) {
      ungrouped.push(items[0])
      continue
    }
    const first = items[0]
    const parts = [
      first.thickness ? `${first.thickness}mm` : '',
      first.width ? `${first.width}mm` : '',
      first.texture ?? '',
    ].filter(Boolean)
    groups.push({
      key: `${first.thickness}__${first.width}__${first.texture}`,
      label: parts.join(' · '),
      items,
    })
  }

  return { groups, ungrouped }
}

function itemSpecs(item: Item) {
  const size =
    item.length && item.width
      ? `${item.length}×${item.width}`
      : item.length
        ? `${item.length}mm`
        : item.width
          ? `${item.width}mm`
          : ''

  const specs = [
    item.code ? `${item.code}` : '',
    size,
    item.thickness ? `${item.thickness}mm` : '',
    item.texture ? item.texture : '',
  ].filter(Boolean)

  return specs.join(' · ')
}

function getVerificationLevel(status: VerificationStatus) {
  if (status === 'manufacturer_verified') return 3
  if (status === 'buildquote_checked') return 2
  return 1
}

function LengthChip({
  item,
  onQtyChange,
}: {
  item: Item
  onQtyChange: (qty: number) => void
}) {
  const isSelected = item.qty > 0
  const chipLabel = item.length ? `${item.length}mm` : item.name

  return (
    <div
      className={`inline-flex items-center rounded-lg border text-sm transition-all ${
        isSelected
          ? 'border-brand bg-brand/10'
          : 'border-border bg-ui text-text-secondary hover:border-brand/40'
      }`}
    >
      <button
        type="button"
        onClick={() => onQtyChange(isSelected ? 0 : 1)}
        className={`px-3 py-2 font-medium leading-none ${
          isSelected ? 'text-brand' : 'text-text-primary'
        }`}
      >
        {chipLabel}
      </button>

      {isSelected && (
        <>
          <span className="text-border-subtle select-none">│</span>
          <button
            type="button"
            onClick={() => onQtyChange(Math.max(0, item.qty - 1))}
            className="px-2 py-2 text-text-faint hover:text-text-primary leading-none"
          >
            −
          </button>
          <span className="min-w-[1.25rem] text-center font-semibold text-text-primary">
            {item.qty}
          </span>
          <button
            type="button"
            onClick={() => onQtyChange(item.qty + 1)}
            className="px-2 py-2 text-text-faint hover:text-text-primary leading-none"
          >
            +
          </button>
        </>
      )}
    </div>
  )
}

function PanelGroupRow({
  group,
  onQtyChange,
}: {
  group: PanelGroup
  onQtyChange: (code: string, qty: number) => void
}) {
  const selectedCount = group.items.filter((i) => i.qty > 0).length

  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        selectedCount > 0
          ? 'border-brand/40 bg-brand/5'
          : 'border-border bg-surface'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">{group.label}</p>
          <p className="mt-0.5 text-xs text-text-faint">{group.items[0].code}</p>
        </div>
        {selectedCount > 0 && (
          <span className="text-xs font-medium text-brand">
            {selectedCount} selected
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {group.items.map((item) => (
          <LengthChip
            key={item.code}
            item={item}
            onQtyChange={(qty) => onQtyChange(item.code, qty)}
          />
        ))}
      </div>
    </div>
  )
}

function ItemRow({
  item,
  onQtyChange,
}: {
  item: Item
  onQtyChange: (qty: number) => void
}) {
  const isSelected = item.qty > 0

  return (
    <div
      className={`grid gap-3 rounded-xl p-3 ${
        isSelected ? 'border-2 border-brand bg-brand/30 shadow-sm' : 'border border-white/20 bg-surface'
      }`}
    >
      <div className="min-w-0">
        <h4 className="text-sm font-semibold leading-tight text-text-primary">
          {item.name}
        </h4>
        <p className="mt-1 break-words text-xs leading-relaxed text-text-secondary">
          {itemSpecs(item)}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            className="h-5 w-5 accent-brand cursor-pointer"
            checked={isSelected}
            onChange={(e) => onQtyChange(e.target.checked ? 1 : 0)}
          />
          <span>Add to RFQ</span>
        </label>

        {isSelected ? (
          <input
            autoFocus
            className="h-10 w-24 rounded-lg border-2 border-brand bg-surface px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
            type="number"
            min="0"
            value={item.qty || ''}
            placeholder="Qty"
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') { onQtyChange(1); return }
              const next = parseInt(raw, 10)
              onQtyChange(Number.isNaN(next) ? 1 : Math.max(0, next))
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export default function SystemCard({
  title,
  subtitle,
  sourceLabel,
  sourceUrl,
  verificationStatus,
  panels,
  accessories,
  onQtyChange,
}: {
  title: string
  subtitle?: string
  sourceLabel?: string | null
  sourceUrl?: string | null
  verificationStatus?: VerificationStatus
  panels: Item[]
  accessories: Item[]
  onQtyChange: (code: string, qty: number) => void
}) {
  const verificationLevel = getVerificationLevel(verificationStatus)
  const [accessoriesOpen, setAccessoriesOpen] = useState(false)
  const { groups, ungrouped } = groupPanels(panels)

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="border-b border-border-subtle pb-4">
        <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--brand-bright)' }}>System</p>
        <h2 className="mt-2 text-2xl font-bold uppercase leading-tight text-text-primary">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-border-subtle bg-ui/60 p-3 text-sm leading-relaxed text-text-secondary">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-faint">
          💡 BQ Tip
        </p>
        <p className="mt-1">Tap a size to select it. Use + / − to set quantities.</p>
        <p>Edit quantities later in BuildQuote.</p>
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-bright)' }}>Panels</h3>
            <span className="text-xs text-text-faint">{panels.length} variants</span>
          </div>
          <div className="space-y-2">
            {groups.map((group) => (
              <PanelGroupRow
                key={group.key}
                group={group}
                onQtyChange={onQtyChange}
              />
            ))}
            {ungrouped.map((item) => (
              <ItemRow
                key={item.code}
                item={item}
                onQtyChange={(qty) => onQtyChange(item.code, qty)}
              />
            ))}
          </div>
        </section>

        <section>
          <button
            type="button"
            onClick={() => setAccessoriesOpen((o) => !o)}
            className="mb-3 flex w-full items-center justify-between gap-3 text-left"
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-bright)' }}>Accessories</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-faint">{accessories.length} items</span>
              <svg
                className={`h-4 w-4 text-text-faint transition-transform duration-200 ${accessoriesOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>
          {accessoriesOpen && (
            <div className="space-y-2">
              {accessories.map((item) => (
                <ItemRow
                  key={item.code}
                  item={item}
                  onQtyChange={(qty) => onQtyChange(item.code, qty)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 border-t border-border-subtle pt-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">Source</p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block break-words text-sm text-[#5FB6D6]-400 hover:underline"
            >
              {sourceLabel || sourceUrl}
            </a>
          ) : (
            <p className="mt-1 text-sm text-text-faint">Source not linked yet</p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">Verification status</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {[
              'AI detected',
              'BuildQuote checked',
              'Manufacturer verified',
            ].map((label, index) => {
              const active = index < verificationLevel
              const last = index === 2

              return (
                <div key={label} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        active ? 'bg-brand' : 'border border-border bg-transparent'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        active ? 'text-text-primary' : 'text-text-faint'
                      }`}
                    >
                      {label}{active && index === 0 ? ' ✓' : ''}
                    </span>
                  </div>

                  {!last ? (
                    <span className="mx-3 hidden text-text-faint sm:inline">—</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
