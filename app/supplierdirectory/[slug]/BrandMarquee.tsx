'use client'

type MarqueeBrand = { id: string; name: string; logo_url: string | null }

export function BrandMarquee({ brands }: { brands: MarqueeBrand[] }) {
  // Only show brands that actually have logos
  const withLogos = brands.filter(b => b.logo_url)
  if (withLogos.length === 0) return null

  // Duplicate the list so the scroll can loop seamlessly
  const items = [...withLogos, ...withLogos, ...withLogos]

  return (
    <div style={{
      background: '#ffffff',
      borderTop: '1px solid #e5e7eb',
      borderBottom: '1px solid #e5e7eb',
      padding: '20px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px',
        background: 'linear-gradient(to right, #ffffff, transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px',
        background: 'linear-gradient(to left, #ffffff, transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes bq-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        .bq-marquee-track {
          display: flex;
          align-items: center;
          gap: 40px;
          width: max-content;
          animation: bq-scroll ${Math.max(18, withLogos.length * 4)}s linear infinite;
        }
        .bq-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="bq-marquee-track">
        {items.map((brand, i) => (
          <div key={`${brand.id}-${i}`} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '6px', flexShrink: 0, padding: '0 20px',
          }}>
            <img
              src={brand.logo_url!}
              alt={brand.name}
              style={{
                height: '44px',
                maxWidth: '140px',
                objectFit: 'contain',
                opacity: 1,
                transition: 'transform 0.2s',
              }}
            />
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#374151',
              letterSpacing: '0.01em', whiteSpace: 'nowrap',
            }}>
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
