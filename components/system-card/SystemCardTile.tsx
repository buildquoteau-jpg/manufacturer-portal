'use client'

// System grid tile — ported from BuildQuote v6's SystemCardTileUI so the
// manufacturer-page grid in Studio previews matches the public library
// pixel-for-pixel. Differences from the v6 source:
//   - plain <img> instead of next/image (static-package friendly)
//   - navigation is host-controlled: pass `href` (public pages) or `onClick`
//     (Studio preview opens the card in-page instead of routing)

import { useState } from 'react'
import type { SystemCardSystem } from './types'

const FONT_HEADING = "'Barlow Condensed', 'Barlow', sans-serif"

export const CATEGORY_COLOURS: Record<string, { bg: string; color: string }> = {
  'Cladding':                      { bg: '#dbeafe', color: '#1e40af' },
  'Flooring':                      { bg: '#d1fae5', color: '#065f46' },
  'Decking':                       { bg: '#d1fae5', color: '#065f46' },
  'Waterproofing':                 { bg: '#e0f2fe', color: '#0369a1' },
  'Interior Linings':              { bg: '#ede9fe', color: '#5b21b6' },
  'Soffit & Eaves':                { bg: '#fce7f3', color: '#9d174d' },
  'Pergolas & Outdoor Structures': { bg: '#fef3c7', color: '#92400e' },
  'Roofing':                       { bg: '#fee2e2', color: '#991b1b' },
  'Framing':                       { bg: '#f3f4f6', color: '#374151' },
  'Screening & Fencing':           { bg: '#fef9c3', color: '#713f12' },
  'Window Hood':                   { bg: '#f0fdf4', color: '#166534' },
}

export function SystemCardTile({
  system,
  addedCount = 0,
  href,
  onClick,
}: {
  system: SystemCardSystem
  addedCount?: number
  href?: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  const profileCount   = system.system_profiles.length
  const componentCount = system.system_components.filter(c => c.components != null).length
  const posX = system.hero_image_position_x ?? 50
  const posY = system.hero_image_position_y ?? 50

  return (
    <a
      href={href ?? '#'}
      onClick={onClick ? (e) => { e.preventDefault(); onClick() } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', textAlign: 'left', width: '100%',
        background: '#ffffff',
        border: hovered ? '1.5px solid #185D7A' : '1px solid #d1d5db',
        borderRadius: '14px', overflow: 'hidden',
        textDecoration: 'none',
        boxShadow: hovered ? '0 8px 28px rgba(24,93,122,0.18)' : '0 2px 10px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        cursor: 'pointer',
      }}
    >
      {/* Hero — name + category overlaid on image */}
      <div style={{
        height: '220px', flexShrink: 0, position: 'relative', overflow: 'hidden',
        background: system.hero_image_url?.trim() ? undefined : 'linear-gradient(135deg, #185D7A 0%, #0f3d52 100%)',
      }}>
        {system.hero_image_url?.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={system.hero_image_url.trim()}
            alt={system.name}
            loading="lazy"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: `${posX}% ${posY}%`,
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,30,45,0.88) 0%, rgba(15,30,45,0.18) 55%, transparent 100%)' }} />

        {addedCount > 0 && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            fontSize: '11px', fontWeight: 700, background: '#166534', color: '#ffffff',
            padding: '3px 9px', borderRadius: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
            ✓ {addedCount} added
          </span>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 14px' }}>
          {system.manufacturer && (
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>
              {system.manufacturer.name}
            </div>
          )}
          <h3 style={{
            margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff',
            lineHeight: 1.2, letterSpacing: '-0.01em',
            textShadow: '0 1px 6px rgba(0,0,0,0.3)',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            fontFamily: FONT_HEADING,
          }}>
            {system.name}
          </h3>
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
            {system.category}{system.subcategory ? ` · ${system.subcategory}` : ''}
          </div>
        </div>
      </div>

      {/* Content strip */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {system.description && (
          <p style={{
            margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {system.description}
          </p>
        )}
        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {profileCount > 0 ? `${profileCount} profile${profileCount !== 1 ? 's' : ''}` : ''}
            {profileCount > 0 && componentCount > 0 ? ' · ' : ''}
            {componentCount > 0 ? `${componentCount} component${componentCount !== 1 ? 's' : ''}` : ''}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#185D7A', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            View details
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2.5L8 6L4.5 9.5" stroke="#185D7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </a>
  )
}
