import { getWidgetData, WidgetComponent, WidgetData, WidgetSystem } from '@/lib/data/getWidgetData'
import { notFound } from 'next/navigation'

// Approximate colour swatches for NTW palette
const COLOUR_MAP: Record<string, string> = {
  'Antique':        '#9B7B5A',
  'Teak':           '#7D5A3C',
  'Walnut':         '#5C3D2E',
  'Blackbutt':      '#C4A882',
  'Ipe':            '#6B4226',
  'Silver Grey':    '#A8A9AD',
  'Beech':          '#D4B896',
  'Aged Wood':      '#8B7355',
  'Canadian Cedar': '#A0522D',
  'Ebony':          '#2C2C2C',
  'Ebony (Charred)':'#1A1A1A',
  'Sea Salt':       '#D8DCD8',
}

function ManufacturerHero({ manufacturer, supplierName }: {
  manufacturer: WidgetData['manufacturer']
  supplierName?: string
}) {
  if (!manufacturer) return null

  const bgStyle = manufacturer.hero_image_url
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${manufacturer.hero_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: 'linear-gradient(135deg, #1b3a2d 0%, #2d5a42 60%, #1b3a2d 100%)' }

  return (
    <div style={{
      ...bgStyle,
      borderRadius: '14px',
      padding: '56px 32px 52px',
      textAlign: 'center',
      marginBottom: '28px',
      overflow: 'hidden',
    }}>
      {/* Logo or brand name */}
      {manufacturer.logo_url ? (
        <img
          src={manufacturer.logo_url}
          alt={manufacturer.name}
          style={{ height: '56px', marginBottom: '18px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
        />
      ) : (
        <div style={{
          fontSize: '34px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          marginBottom: '10px',
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          lineHeight: 1.1,
        }}>
          {manufacturer.name}
        </div>
      )}

      {/* Stocked at pill */}
      {supplierName && (
        <div style={{
          display: 'inline-block',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.75)',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px',
          padding: '4px 12px',
          marginBottom: '20px',
        }}>
          Stocked at {supplierName}
        </div>
      )}

      {/* Description */}
      {manufacturer.description && (
        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '14px',
          lineHeight: 1.65,
          maxWidth: '580px',
          margin: '0 auto 24px',
          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
        }}>
          {manufacturer.description}
        </p>
      )}

      {/* Visit website */}
      {manufacturer.website_url && (
        <a
          href={manufacturer.website_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 22px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Visit {manufacturer.name}
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 10L10 2M10 2H4M10 2V8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      )}
    </div>
  )
}

function ColourChip({ colour }: { colour: WidgetSystem['system_colours'][number] }) {
  return (
    <span
      title={colour.colour_name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        color: '#6b7280',
        background: '#f3f4f6',
        borderRadius: '20px',
        padding: '3px 8px 3px 5px',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: COLOUR_MAP[colour.colour_name] || '#888',
        border: '1px solid rgba(0,0,0,0.15)',
        flexShrink: 0,
      }} />
      {colour.colour_name}
    </span>
  )
}

function ColourChips({ colours }: { colours: WidgetSystem['system_colours'] }) {
  const stocked = colours.filter(c => c.is_stocked)
  if (stocked.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
      {stocked.map((c) => (
        <ColourChip key={c.colour_name} colour={c} />
      ))}
    </div>
  )
}

function ComponentList({ components, role }: { components: WidgetComponent[], role: 'required' | 'recommended' }) {
  const filtered = components.filter(c => c.role === role && c.components)
  if (filtered.length === 0) return null

  return (
    <div style={{ marginTop: role === 'required' ? '0' : '10px' }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: role === 'required' ? '#374151' : '#9ca3af',
        marginBottom: '6px',
      }}>
        {role === 'required' ? 'Required' : 'Recommended'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.map((item, i) => (
          <div key={i} style={{
            padding: '7px 10px',
            background: role === 'required' ? '#f9fafb' : '#fafafa',
            border: '1px solid',
            borderColor: role === 'required' ? '#e5e7eb' : '#f3f4f6',
            borderRadius: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                {item.components!.name}
              </span>
              {item.components!.sku && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: '#6b7280',
                  background: '#f3f4f6',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {item.components!.sku}
                </span>
              )}
            </div>
            {item.notes && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', lineHeight: 1.4 }}>
                {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SystemCard({ system }: { system: WidgetSystem }) {
  const categoryColour: Record<string, string> = {
    'Decking':             '#d1fae5',
    'Cladding':            '#dbeafe',
    'Screening & Fencing': '#fef3c7',
  }
  const categoryText: Record<string, string> = {
    'Decking':             '#065f46',
    'Cladding':            '#1e40af',
    'Screening & Fencing': '#92400e',
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Hero image or placeholder */}
      <div style={{
        height: '160px',
        background: system.hero_image_url ? `url(${system.hero_image_url}) center/cover` : '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
      }}>
        {!system.hero_image_url && (
          <span style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#d1d5db',
            letterSpacing: '-0.02em',
            fontFamily: 'monospace',
          }}>
            {system.product_code}
          </span>
        )}
        <span style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: categoryColour[system.category] || '#f3f4f6',
          color: categoryText[system.category] || '#374151',
          padding: '3px 8px',
          borderRadius: '20px',
        }}>
          {system.category}
        </span>
        {system.double_sided && (
          <span style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            fontSize: '10px',
            fontWeight: 600,
            background: '#ffffff',
            color: '#374151',
            padding: '3px 8px',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
          }}>
            Double sided
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '4px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {system.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 600,
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '1px 6px',
              borderRadius: '4px',
            }}>
              {system.product_code}
            </span>
            {system.dimensions && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {system.dimensions}
                {system.length_m && ` · ${system.length_m}m`}
              </span>
            )}
          </div>
        </div>

        {system.description && (
          <p style={{
            margin: '8px 0 0',
            fontSize: '12px',
            color: '#6b7280',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {system.description}
          </p>
        )}

        {system.system_colours.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '6px',
            }}>
              Available Colours
            </div>
            <ColourChips colours={system.system_colours} />
          </div>
        )}

        {system.system_components.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', flex: 1 }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '8px',
            }}>
              Fixings &amp; Components
            </div>
            <ComponentList components={system.system_components} role="required" />
            <ComponentList components={system.system_components} role="recommended" />
          </div>
        )}

        {system.website_url && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
            <a
              href={system.website_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              View on NewTech Wood
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L10 2M10 2H4M10 2V8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const widget = await getWidgetData(token)

  if (!widget) return notFound()

  return (
    <div style={{
      padding: '24px 20px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh',
    }}>
      {/* Brand hero */}
      <ManufacturerHero
        manufacturer={widget.manufacturer}
        supplierName={widget.supplier?.name}
      />

      {/* Profile count */}
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>
        {widget.systems.length === 1
          ? '1 profile available'
          : `${widget.systems.length} profiles available`}
      </p>

      {/* Cards grid — auto-fill so any number of products wraps cleanly */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {widget.systems.map((system) => (
          <SystemCard key={system.id} system={system} />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
        fontSize: '11px',
        color: '#d1d5db',
      }}>
        Powered by BuildQuote
      </div>
    </div>
  )
}
