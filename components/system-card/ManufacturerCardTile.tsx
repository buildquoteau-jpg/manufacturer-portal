'use client'

// Manufacturer tile — ported from BuildQuote v6's ManufacturerTileUI
// (components/library/LibraryPageClient.tsx) so the Manufacturer view in
// Trade Desk matches the public library's "Browse by Manufacturer" grid.
// Differences from the v6 source:
//   - navigation is host-controlled: pass `onClick` (Trade Desk drills into
//     its own product view in place) instead of v6's `href={/library/{slug}}`
//   - `count` label is caller-supplied text ("N matches" in Trade Desk vs
//     v6's fixed "N product systems") since Trade Desk's count means
//     "matches this search", not "total systems this manufacturer has"

import { useState } from 'react'

export type ManufacturerTileData = {
  name: string
  hero_image_url: string | null
  hero_image_position_y: number | null
  description: string | null
}

export function ManufacturerCardTile({
  manufacturer,
  countLabel,
  onClick,
}: {
  manufacturer: ManufacturerTileData
  countLabel: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const posY = manufacturer.hero_image_position_y ?? 50

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', width: '100%', padding: 0, textAlign: 'left',
        background: '#fff', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
        border: hovered ? '1.5px solid #185D7A' : '1px solid #d1d5db',
        boxShadow: hovered ? '0 8px 28px rgba(24,93,122,0.18)' : '0 2px 10px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Hero — manufacturer name overlaid on image */}
      <div style={{
        height: '150px', flexShrink: 0, position: 'relative', overflow: 'hidden',
        background: manufacturer.hero_image_url ? undefined : 'linear-gradient(135deg, #185D7A 0%, #0f3d52 100%)',
      }}>
        {manufacturer.hero_image_url && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${manufacturer.hero_image_url})`, backgroundSize: 'cover',
            backgroundPosition: `center ${posY}%`,
          }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,30,45,0.88) 0%, rgba(15,30,45,0.18) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 12px' }}>
          <h3 style={{
            margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff', lineHeight: 1.15,
            letterSpacing: '-0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.35)',
            fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            {manufacturer.name}
          </h3>
        </div>
      </div>

      {/* Content strip — description + match count */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {manufacturer.description && (
          <p style={{
            margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {manufacturer.description}
          </p>
        )}
        <span style={{ marginTop: 'auto', fontSize: '13px', fontWeight: 700, color: '#185D7A', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {countLabel}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="#185D7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </button>
  )
}
