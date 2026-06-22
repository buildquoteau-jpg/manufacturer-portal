'use client'

import { useState } from 'react'
import { WidgetClient } from '@/app/widget/[token]/WidgetClient'
import { ManufacturerHero } from '@/app/widget/[token]/ManufacturerHero'
import type { WidgetData } from '@/lib/data/getWidgetData'
import type { SupplierDetailBrand } from '@/lib/data/getPublicSuppliers'

type EmbedWidget = {
  brand: SupplierDetailBrand
  widget: WidgetData
}

export function EmbedClient({
  widgets,
  supplierName,
}: {
  widgets: EmbedWidget[]
  supplierName: string
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = widgets[activeIdx]

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '0 0 48px' }}>

      {/* Brand tabs — only shown when there are multiple brands */}
      {widgets.length > 1 && (
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 20px',
          display: 'flex',
          gap: '0',
          overflowX: 'auto',
        }}>
          {widgets.map((w, i) => (
            <button
              key={w.brand.slug}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '14px 18px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${i === activeIdx ? '#185D7A' : 'transparent'}`,
                color: i === activeIdx ? '#185D7A' : '#6b7280',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {w.brand.name}
            </button>
          ))}
        </div>
      )}

      {/* Manufacturer hero + product cards */}
      {active?.widget && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 0' }}>
          <ManufacturerHero
            manufacturer={active.widget.manufacturer}
            supplierName={supplierName}
          />
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>
            {active.widget.systems.length === 1
              ? '1 system available'
              : `${active.widget.systems.length} systems available`}
          </p>
          <WidgetClient
            systems={active.widget.systems}
            widgetId={active.widget.id}
            supplierName={supplierName}
            manufacturerName={active.widget.manufacturer?.name}
          />
        </div>
      )}

    </div>
  )
}
