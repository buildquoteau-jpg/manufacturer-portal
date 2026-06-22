'use client'

import { useState } from 'react'

export function BrowseDropdown({
  brands,
  supplierSlug,
}: {
  brands: { name: string; slug: string; system_count: number }[]
  supplierSlug: string
}) {
  const [selected, setSelected] = useState(brands[0]?.slug ?? '')

  return (
    <div style={{
      background: '#eef6fa',
      border: '1.5px solid #b8d9e8',
      borderRadius: '14px',
      padding: '20px 24px',
      marginBottom: '24px',
    }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f2d3d' }}>
        Browse Product Catalogue
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
        Select a product range to explore available systems, specifications and sizes.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '11px 14px',
            fontSize: '14px',
            border: '1.5px solid #93c5d8',
            borderRadius: '8px',
            background: '#ffffff',
            color: '#111827',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'auto',
          }}
        >
          {brands.map(b => (
            <option key={b.slug} value={b.slug}>
              {b.name} — {b.system_count} system{b.system_count !== 1 ? 's' : ''}
            </option>
          ))}
        </select>
        <a
          href={`/supplierdirectory/${supplierSlug}/${selected}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '11px 22px',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            background: '#185D7A',
            borderRadius: '8px',
            textDecoration: 'none',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(24,93,122,0.2)',
          }}
        >
          Browse Products →
        </a>
      </div>
    </div>
  )
}
