'use client'

import { useState } from 'react'
import { SupplierData, Manufacturer } from './shared'
import { SystemCardTile } from '@/components/system-card/SystemCardTile'
import { ManufacturerCardTile } from '@/components/system-card/ManufacturerCardTile'
import { adaptProductionSystem } from '@/components/system-card/adaptProductionSystem'

function stockedIdsFromSupplier(s: SupplierData): Set<string> {
  return new Set(s.embed_widgets.flatMap(w => w.embed_widget_systems.map(ews => ews.system_id)))
}

export function MyProductsTab({
  supplier,
  manufacturers,
  accessToken,
  slug,
  onReload,
}: {
  supplier: SupplierData
  manufacturers: Manufacturer[]
  accessToken: string
  slug: string
  onReload: () => void
}) {
  const [openManufacturerSlug, setOpenManufacturerSlug] = useState<string | null>(null)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Local optimistic mirror of "what's stocked" (derived from embed_widgets —
  // same underlying data Trade Desk reads, just presented here without the
  // widget/embed-code framing). Reset from the supplier prop whenever it
  // changes (e.g. after onReload), adjusted during render rather than an
  // effect to avoid an extra render pass.
  const [localStockedIds, setLocalStockedIds] = useState(() => stockedIdsFromSupplier(supplier))
  const [prevSupplier, setPrevSupplier] = useState(supplier)
  if (supplier !== prevSupplier) {
    setPrevSupplier(supplier)
    setLocalStockedIds(stockedIdsFromSupplier(supplier))
  }

  function widgetForManufacturer(manufacturerId: string) {
    return supplier.embed_widgets.find(w =>
      w.embed_widget_systems.some(ews => ews.systems.manufacturer_id === manufacturerId)
    )
  }

  async function toggleStocked(mf: Manufacturer, systemId: string) {
    const wasStocked = localStockedIds.has(systemId)
    setError(null)
    setLocalStockedIds(prev => {
      const next = new Set(prev)
      wasStocked ? next.delete(systemId) : next.add(systemId)
      return next
    })
    setSavingIds(prev => new Set(prev).add(systemId))

    try {
      const widget = widgetForManufacturer(mf.id)
      let res: Response

      if (widget) {
        const currentIds = widget.embed_widget_systems.map(e => e.system_id)
        const nextIds = wasStocked ? currentIds.filter(id => id !== systemId) : [...currentIds, systemId]
        if (nextIds.length === 0) {
          throw new Error('Keep at least one product selected for a manufacturer, or remove it entirely from the Website Widgets tab.')
        }
        res = await fetch('/api/supplier/update-widget-systems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ widgetId: widget.id, systemIds: nextIds, supplierSlug: slug }),
        })
      } else if (!wasStocked) {
        res = await fetch('/api/supplier/create-widget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ supplierSlug: slug, systemIds: [systemId] }),
        })
      } else {
        // Marked "stocked" locally but no widget backs it — shouldn't happen
        // (widgets are the only source of truth), nothing to save.
        return
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to save')
      }
      onReload()
    } catch (err) {
      // Revert the optimistic flip.
      setLocalStockedIds(prev => {
        const next = new Set(prev)
        wasStocked ? next.add(systemId) : next.delete(systemId)
        return next
      })
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingIds(prev => { const next = new Set(prev); next.delete(systemId); return next })
    }
  }

  const openManufacturer = manufacturers.find(m => m.slug === openManufacturerSlug) ?? null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-brand">My Products</h2>
        <p className="text-text-secondary text-sm mt-1">
          {openManufacturer
            ? 'Click a product to mark it as stocked — click again to remove it.'
            : 'Pick a manufacturer, then choose which of their products you stock.'}
        </p>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {!openManufacturer ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {manufacturers.map(mf => {
            const total = mf.systems.length
            const stocked = mf.systems.filter(s => localStockedIds.has(s.id)).length
            return (
              <ManufacturerCardTile
                key={mf.slug}
                manufacturer={{
                  name: mf.name,
                  hero_image_url: mf.hero_image_url,
                  hero_image_position_y: mf.hero_image_position_y,
                  description: mf.description,
                }}
                countLabel={stocked > 0
                  ? `${stocked} of ${total} selected`
                  : `${total} product system${total !== 1 ? 's' : ''}`}
                onClick={() => setOpenManufacturerSlug(mf.slug)}
              />
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setOpenManufacturerSlug(null)}
            className="text-sm text-brand hover:underline font-semibold"
          >
            ← All manufacturers
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {openManufacturer.systems.map(sys => {
              const system = adaptProductionSystem(sys, {
                name: openManufacturer.name, slug: openManufacturer.slug, logo_url: openManufacturer.logo_url,
              })
              const stocked = localStockedIds.has(sys.id)
              const saving = savingIds.has(sys.id)
              return (
                <div key={sys.id} className="relative">
                  <SystemCardTile system={system} onClick={() => !saving && toggleStocked(openManufacturer, sys.id)} />
                  <div
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      stocked ? 'bg-success border-success' : 'bg-white/90 border-white'
                    } ${saving ? 'opacity-60' : ''}`}
                  >
                    {stocked && <span className="text-white text-base font-bold leading-none">✓</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
