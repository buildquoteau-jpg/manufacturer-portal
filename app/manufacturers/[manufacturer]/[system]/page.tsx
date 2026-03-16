'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import SystemCard from '@/components/ui/SystemCard'

type Item = {
  id: string
  code: string
  name: string
  description?: string | null
  length?: number | null
  width?: number | null
  thickness?: number | null
  texture?: string | null
  uom: string
  qty: number
  checked: boolean
}

function buildItemSpecs(item: Item) {
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

  return specs.join(' • ')
}

type Manufacturer = {
  id: string
  name: string
  slug: string
}

type SystemRecord = {
  id: string
  name: string
  slug: string
  source_label?: string | null
  source_url?: string | null
  verification_status?: string | null
  panels: Item[]
  accessories: Item[]
}

type DisplayComponent = {
  id: string
  sku: string
  name: string
  description: string | null
  uom: string
  category: string
  length_mm: number | null
  width_mm: number | null
  thickness_mm: number | null
  texture: string | null
  role: string | null
  link_sort_order: number
}

function buildItems(system: { panels?: Item[]; accessories?: Item[] }): Item[] {
  const panels = (system.panels || []).map((p) => ({ ...p, qty: 0, checked: false }))
  const accessories = (system.accessories || []).map((a) => ({ ...a, qty: 0, checked: false }))
  return [...panels, ...accessories]
}

export default function SystemPage({ params }: { params: Promise<{ manufacturer: string; system: string }> }) {
  const { manufacturer: mfrSlug, system: systemSlug } = use(params)

  const [mfr, setMfr] = useState<Manufacturer | null>(null)
  const [system, setSystem] = useState<SystemRecord | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const searchParams = useSearchParams()
  const draft = searchParams.get('draft') || ''

  useEffect(() => {
    async function load() {
      const { data: manufacturer } = await supabase
        .from('manufacturers')
        .select('id, name, slug')
        .eq('slug', mfrSlug)
        .single()

      if (!manufacturer) return

      const { data: sys } = await supabase
        .from('systems')
        .select('id, name, slug, manufacturer_id, source_label, source_url, verification_status')
        .eq('manufacturer_id', manufacturer.id)
        .eq('slug', systemSlug)
        .single()

      if (!sys) return

      const { data: links } = await supabase
        .from('system_components')
        .select('component_id, role, sort_order')
        .eq('system_id', sys.id)
        .order('sort_order')

      if (!links || links.length === 0) {
        const emptySystem: SystemRecord = { ...sys, panels: [], accessories: [] }
        setMfr(manufacturer)
        setSystem(emptySystem)
        setItems([])
        return
      }

      const componentIds = links.map((l) => l.component_id)

      const { data: components } = await supabase
        .from('components')
        .select('id, sku, name, description, uom, category, length_mm, width_mm, thickness_mm, texture')
        .in('id', componentIds)

      if (!components) return

      const componentMap = new Map(components.map((c) => [c.id, c]))

      const rows: DisplayComponent[] = links
        .map((link) => {
          const component = componentMap.get(link.component_id)
          if (!component) return null
          return {
            ...component,
            role: link.role,
            link_sort_order: link.sort_order ?? 0,
          }
        })
        .filter((row): row is DisplayComponent => row !== null)

      const panels = rows.filter((r) => r.role === 'primary_cladding' || r.category === 'panel')
      const accessories = rows.filter((r) => !(r.role === 'primary_cladding' || r.category === 'panel'))

      const mappedSystem: SystemRecord = {
        ...sys,
        panels: panels.map((p) => ({
          id: p.id,
          code: p.sku,
          name: p.name,
          description: p.description,
          length: p.length_mm,
          width: p.width_mm,
          thickness: p.thickness_mm,
          texture: p.texture,
          uom: p.uom,
          qty: 0,
          checked: false,
        })),
        accessories: accessories.map((a) => ({
          id: a.id,
          code: a.sku,
          name: a.name,
          description: a.description,
          length: a.length_mm,
          width: a.width_mm,
          thickness: a.thickness_mm,
          texture: a.texture,
          uom: a.uom,
          qty: 0,
          checked: false,
        })),
      }

      setMfr(manufacturer)
      setSystem(mappedSystem)
      setItems(buildItems(mappedSystem))
    }

    load()
  }, [mfrSlug, systemSlug])

  const panels = useMemo(
    () => items.filter((i) => system?.panels?.some((p) => p.code === i.code)),
    [items, system]
  )

  const accessories = useMemo(
    () => items.filter((i) => system?.accessories?.some((a) => a.code === i.code)),
    [items, system]
  )

  function onQtyChange(code: string, qty: number) {
    setItems((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: Math.max(0, qty), checked: Math.max(0, qty) > 0 } : item
      )
    )
  }

  function withDraft(path: string) {
    return draft ? `${path}?draft=${encodeURIComponent(draft)}` : path
  }

  const selectedCount = items.filter((i) => i.qty > 0).length
  const selectedLabel = `${selectedCount} item${selectedCount === 1 ? '' : 's'} selected`

  async function handleAddSelected() {
    if (!draft) return

    const selected = items.filter((i) => i.qty > 0)
    if (selected.length === 0) return

    const payload = {
      draft_id: draft,
      items: selected.map((i) => ({
        component_id: i.id,
        sku: i.code,
        name: i.name,
        description: buildItemSpecs(i),
        uom: i.uom,
        qty: i.qty,
      })),
    }

    try {
      const res = await fetch('/api/add-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      console.log('add-components status', res.status)
      console.log('add-components body', text)

      if (!res.ok) {
        throw new Error(`add-components failed: ${res.status} ${text}`)
      }

      window.location.href = `https://buildquote.com.au/rfq?draft=${draft}`
    } catch (e) {
      console.error('RFQ insert failed', e)
      alert(String(e))
    }
  }

  if (!system || !mfr) return <div className="p-10 text-center">Loading system…</div>

  return (
    <div className="min-h-screen bg-ui flex justify-center p-4">
      <div className="w-full max-w-xl space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <Link href={withDraft(`/manufacturers/${mfr.slug}`)} className="text-brand hover:underline">
            ← Back to {mfr.name}
          </Link>
          <span className="text-text-faint">/</span>
          <Link href={withDraft('/manufacturers')} className="text-text-secondary hover:underline">
            All manufacturers
          </Link>
        </div>

        <div className="rounded-2xl border border-brand/30 bg-surface p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-bright)]">
            Add these selections to your BuildQuote RFQ
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex w-fit items-center rounded-full border border-border bg-ui/70 px-3 py-1 text-sm text-text-primary">
              {selectedLabel}
            </span>
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={!draft || selectedCount === 0}
              className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add selected items
            </button>
          </div>
          {!draft ? (
            <p className="mt-2 text-xs text-text-faint">RFQ draft not linked yet.</p>
          ) : null}
        </div>

        <SystemCard
          title={system.name}
          subtitle={`${mfr.name} · ${selectedCount} selected`}
          sourceLabel={system.source_label}
          sourceUrl={system.source_url}
          verificationStatus={system.verification_status}
          panels={panels}
          accessories={accessories}
          onQtyChange={onQtyChange}
        />

        <div className="sticky bottom-3">
          <div className="rounded-2xl border border-brand/30 bg-surface/95 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-bright)]">
                  BuildQuote RFQ
                </p>
                <p className="mt-1 text-sm text-text-primary">{selectedLabel}</p>
              </div>
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={!draft || selectedCount === 0}
                className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add selected items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
