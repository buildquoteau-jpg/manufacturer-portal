'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { WidgetSystem, WidgetComponent } from '@/lib/data/getWidgetData'

// ── Colour swatches ────────────────────────────────────────────────────────
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

function ColourChip({ colour }: { colour: WidgetSystem['system_colours'][number] }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', color: '#6b7280', background: '#f3f4f6',
      borderRadius: '20px', padding: '3px 8px 3px 5px', whiteSpace: 'nowrap',
    }}>
      <span style={{
        display: 'inline-block', width: '10px', height: '10px',
        borderRadius: '50%', background: COLOUR_MAP[colour.colour_name] || '#888',
        border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0,
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
      {stocked.map((c) => <ColourChip key={c.colour_name} colour={c} />)}
    </div>
  )
}

function ComponentList({ components, role }: { components: WidgetComponent[], role: 'required' | 'recommended' }) {
  const filtered = components.filter(c => c.role === role && c.components)
  if (filtered.length === 0) return null
  return (
    <div style={{ marginTop: role === 'required' ? '0' : '10px' }}>
      <div style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
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
                  fontSize: '10px', fontFamily: 'monospace', color: '#6b7280',
                  background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px',
                  whiteSpace: 'nowrap', flexShrink: 0,
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

// ── RFQ Modal ──────────────────────────────────────────────────────────────
function RfqModal({
  system,
  widgetId,
  supplierName,
  onClose,
}: {
  system: WidgetSystem
  widgetId: string
  supplierName?: string
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hi, I'm interested in ${system.product_code} — ${system.name}. Please get in touch.`,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setSubmitting(true)
    setError('')

    const { error: dbError } = await supabase.from('rfq_enquiries').insert({
      widget_id: widgetId,
      system_id: system.id,
      system_name: system.name,
      product_code: system.product_code,
      supplier_name: supplierName || null,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim() || null,
    })

    if (dbError) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    background: '#fafafa',
    color: '#111827',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '5px',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              Enquire about this product
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              {system.product_code} — {system.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '22px', color: '#9ca3af', lineHeight: 1,
              padding: '0 0 0 8px', flexShrink: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#d1fae5', margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
            }}>
              ✓
            </div>
            <p style={{ fontWeight: 700, fontSize: '16px', color: '#111827', margin: '0 0 6px' }}>
              Enquiry received!
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              {supplierName ? `${supplierName}` : 'The team'} will be in touch soon.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: '22px',
                padding: '10px 28px',
                background: '#1b3a2d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Full name <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                style={inputStyle}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => set('email', e.target.value)}
                style={inputStyle}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                style={inputStyle}
                placeholder="04xx xxx xxx"
              />
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                value={form.message}
                onChange={e => set('message', e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            {error && (
              <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '11px',
                background: submitting ? '#6b7280' : '#1b3a2d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: '2px',
              }}
            >
              {submitting ? 'Sending…' : 'Send enquiry'}
            </button>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
              Your details will only be shared with {supplierName || 'this supplier'}.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ── System Card ────────────────────────────────────────────────────────────
function SystemCard({
  system,
  onEnquire,
}: {
  system: WidgetSystem
  onEnquire: (system: WidgetSystem) => void
}) {
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
      {/* Hero image */}
      <div style={{
        height: '160px',
        background: system.hero_image_url ? `url(${system.hero_image_url}) center/cover` : '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
      }}>
        {!system.hero_image_url && (
          <span style={{
            fontSize: '28px', fontWeight: 800, color: '#d1d5db',
            letterSpacing: '-0.02em', fontFamily: 'monospace',
          }}>
            {system.product_code}
          </span>
        )}
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: categoryColour[system.category] || '#f3f4f6',
          color: categoryText[system.category] || '#374151',
          padding: '3px 8px', borderRadius: '20px',
        }}>
          {system.category}
        </span>
        {system.double_sided && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            fontSize: '10px', fontWeight: 600,
            background: '#ffffff', color: '#374151',
            padding: '3px 8px', borderRadius: '20px', border: '1px solid #e5e7eb',
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
              fontSize: '12px', fontFamily: 'monospace', fontWeight: 600,
              color: '#6b7280', background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px',
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
            margin: '8px 0 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {system.description}
          </p>
        )}

        {system.system_colours.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px',
            }}>
              Available Colours
            </div>
            <ColourChips colours={system.system_colours} />
          </div>
        )}

        {system.system_components.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', flex: 1 }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px',
            }}>
              Fixings &amp; Components
            </div>
            <ComponentList components={system.system_components} role="required" />
            <ComponentList components={system.system_components} role="recommended" />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Enquire button */}
          <button
            onClick={() => onEnquire(system)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              width: '100%', padding: '10px 12px',
              fontSize: '13px', fontWeight: 600,
              color: '#ffffff', background: '#1b3a2d',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
            }}
          >
            Enquire about this product
          </button>

          {/* View on NTW */}
          {system.website_url && (
            <a
              href={system.website_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '9px 12px',
                fontSize: '12px', fontWeight: 600,
                color: '#374151', background: '#f9fafb',
                border: '1px solid #e5e7eb', borderRadius: '8px',
                textDecoration: 'none', cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              View on NewTech Wood
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L10 2M10 2H4M10 2V8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export function WidgetClient({
  systems,
  widgetId,
  supplierName,
}: {
  systems: WidgetSystem[]
  widgetId: string
  supplierName?: string
}) {
  const [activeSystem, setActiveSystem] = useState<WidgetSystem | null>(null)

  return (
    <>
      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {systems.map((system) => (
          <SystemCard key={system.id} system={system} onEnquire={setActiveSystem} />
        ))}
      </div>

      {/* RFQ modal */}
      {activeSystem && (
        <RfqModal
          system={activeSystem}
          widgetId={widgetId}
          supplierName={supplierName}
          onClose={() => setActiveSystem(null)}
        />
      )}
    </>
  )
}
