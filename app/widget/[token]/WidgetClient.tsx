'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { WidgetSystem, WidgetComponent, WidgetProfile, WidgetColour } from '@/lib/data/getWidgetData'
import { SystemCardTile, CATEGORY_COLOURS } from '@/components/ui/SystemCardTile'

const BUILDQUOTE_URL = process.env.NEXT_PUBLIC_BUILDQUOTE_URL || 'https://buildquote.com.au'

const REGION_LABELS: Record<string, string> = {
  sw_wa: 'SW WA', perth: 'Perth Metro', nw_wa: 'NW WA',
  goldfields: 'WA Goldfields', midwest: 'WA Midwest', national: 'National',
}

type StockistResult = {
  id: string; name: string; suburb: string | null; state: string | null
  phone: string | null; email: string | null; service_postcodes: string | null
  delivery_info: string | null; region: string | null
}

function matchesPostcode(servicePostcodes: string | null, postcode: string): boolean {
  if (!servicePostcodes || !postcode.trim()) return false
  return servicePostcodes.split(/[\s,]+/).map(p => p.trim()).includes(postcode.trim())
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDims(p: WidgetProfile): string {
  const parts: string[] = []
  if (p.length_mm) parts.push(`${p.length_mm}mm`)
  if (p.width_mm)  parts.push(`${p.width_mm}mm`)
  if (p.height_mm && !p.length_mm) parts.push(`${p.height_mm}mm`)
  if (p.thickness_mm) parts.push(`${p.thickness_mm}mm`)
  return parts.join(' × ')
}

function fmtUom(uom: string | null): string {
  if (!uom) return ''
  const map: Record<string, string> = {
    sheet: 'SHEET', roll: 'ROLL', ea: 'EACH', each: 'EACH',
    lm: 'LIN.M', m2: 'M²', kg: 'KG', box: 'BOX', pack: 'PACK', length: 'LENGTH',
  }
  return map[uom.toLowerCase()] ?? uom.toUpperCase()
}

// ── Checkbox UI ────────────────────────────────────────────────────────────

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: '22px', height: '22px', borderRadius: '6px',
      background: checked ? '#185D7A' : '#fff',
      border: `2px solid ${checked ? '#185D7A' : '#d1d5db'}`,
    }}>
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
  )
}

// ── Profile grouping ───────────────────────────────────────────────────────

function formatGroupKey(key: string): string {
  return /^\d+(\.\d+)?$/.test(key) ? `${key}mm` : key
}

type ProfileGroup = { key: string; items: { label: string; profile: WidgetProfile }[] }

function groupProfiles(profiles: WidgetProfile[]): ProfileGroup[] {
  if (profiles.length === 0) return []

  const names     = profiles.map(p => (p.profile_name || p.name || '').trim())
  const tokenized = names.map(n => n.split(/\s+/))
  const maxLen    = Math.max(...tokenized.map(t => t.length))

  // Strategy 1: " — " separator
  if (names.some(n => n.includes(' — '))) {
    const map = new Map<string, { label: string; profile: WidgetProfile }[]>()
    for (let i = 0; i < profiles.length; i++) {
      const sep = names[i].indexOf(' — ')
      const key   = sep !== -1 ? names[i].slice(0, sep) : ''
      const label = sep !== -1 ? names[i].slice(sep + 3) : names[i]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ label, profile: profiles[i] })
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  }

  function buildMap(fromEnd: boolean, n: number) {
    const map = new Map<string, { label: string; profile: WidgetProfile }[]>()
    for (let i = 0; i < profiles.length; i++) {
      const t = tokenized[i]; const len = t.length
      let key: string, label: string
      if (fromEnd) {
        key   = t.slice(Math.max(0, len - n)).join(' ')
        label = t.slice(0, Math.max(0, len - n)).join(' ').replace(/\s*[x×]\s*$/, '').trim() || names[i]
      } else {
        key   = t.slice(0, n).join(' ')
        label = t.slice(n).join(' ') || names[i]
      }
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ label, profile: profiles[i] })
    }
    return map
  }

  function findMinN(fromEnd: boolean): number {
    for (let n = 1; n < maxLen; n++) {
      const counts = new Map<string, number>()
      for (const t of tokenized) {
        const k = fromEnd ? t.slice(Math.max(0, t.length - n)).join(' ') : t.slice(0, n).join(' ')
        counts.set(k, (counts.get(k) ?? 0) + 1)
      }
      if (Array.from(counts.values()).some(c => c > 1)) return n
    }
    return 0
  }

  // Strategy 2: try prefix and suffix; prefer whichever gives fewer groups
  const prefixN = findMinN(false)
  const suffixN = findMinN(true)
  const prefixMap = prefixN > 0 ? buildMap(false, prefixN) : null
  const suffixMap = suffixN > 0 ? buildMap(true,  suffixN) : null

  let chosen: Map<string, { label: string; profile: WidgetProfile }[]> | null = null
  if (prefixMap && suffixMap) {
    chosen = suffixMap.size < prefixMap.size ? suffixMap : prefixMap
  } else {
    chosen = prefixMap ?? suffixMap
  }

  if (chosen) return Array.from(chosen.entries()).map(([key, items]) => ({ key, items }))

  // Strategy 3: single group
  return [{ key: '', items: profiles.map((p, i) => ({ label: names[i], profile: p })) }]
}

// ── Colours section ────────────────────────────────────────────────────────

function ColoursSection({ colours, selected, onSelect }: {
  colours: WidgetColour[]
  selected?: string | null
  onSelect?: (name: string) => void
}) {
  if (colours.length === 0) return null
  return (
    <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {colours.map((c, i) => {
        const isSel = selected === c.colour_name
        const Tag = onSelect ? 'button' : 'span'
        return (
          <Tag
            key={i}
            type={onSelect ? 'button' : undefined}
            onClick={onSelect ? () => onSelect(c.colour_name) : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              fontSize: '13px', fontWeight: isSel ? 700 : 500,
              background: isSel ? '#eef6fa' : '#f8fafc',
              color: isSel ? '#185D7A' : '#374151',
              border: `${isSel ? '2px' : '1px'} solid ${isSel ? '#185D7A' : '#e2e8f0'}`,
              padding: c.image_url ? '4px 10px 4px 4px' : '5px 12px',
              borderRadius: '20px', lineHeight: 1.4,
              cursor: onSelect ? 'pointer' : 'default',
              transition: 'all 0.12s',
            }}
          >
            {c.image_url && (
              <span style={{
                display: 'inline-block', width: '20px', height: '20px',
                borderRadius: '50%', flexShrink: 0,
                background: `url(${c.image_url}) center/cover`,
                border: '1px solid rgba(0,0,0,0.1)',
              }} />
            )}
            {c.colour_name}
            {isSel && <span style={{ fontSize: '11px' }}>✓</span>}
            {c.is_stocked === false && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af' }}>EOI</span>
            )}
          </Tag>
        )
      })}
    </div>
  )
}

// ── Profile row ────────────────────────────────────────────────────────────

function ProfileRow({
  label, profile, selected, onToggle,
}: {
  label: string
  profile: WidgetProfile
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const id    = profile.id
  const isSel = selected.has(id)
  const dims  = fmtDims(profile)
  const uom   = fmtUom(profile.uom)
  const sku   = profile.product_code

  function extractNums(s: string) { return (s.match(/\d+(?:\.\d+)?/g) || []).map(Number) }
  const labelNums = extractNums(label)
  const dimsNums  = extractNums(dims)
  const labelOverlaps = labelNums.length > 0 && labelNums.every((n, i) => dimsNums[i] === n)

  return labelOverlaps ? (
    <button
      type="button"
      onClick={() => onToggle(id)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '10px', width: '100%', textAlign: 'left',
        padding: '9px 12px',
        background: isSel ? '#eef6fa' : '#f9fafb',
        border: `1.5px solid ${isSel ? '#185D7A' : '#e5e7eb'}`,
        borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: isSel ? 700 : 600, color: isSel ? '#0f2d3d' : '#111827' }}>
          {dims}
        </span>
        {uom && (
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: isSel ? '#185D7A' : '#6b7280' }}>
            {uom}
          </span>
        )}
        {sku && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4b5563', background: isSel ? '#d4ecf5' : '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>
            {sku}
          </span>
        )}
      </div>
      <Checkbox checked={isSel} />
    </button>
  ) : (
    <button
      type="button"
      onClick={() => onToggle(id)}
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: '10px', width: '100%', textAlign: 'left',
        padding: '9px 12px',
        background: isSel ? '#eef6fa' : '#f9fafb',
        border: `1.5px solid ${isSel ? '#185D7A' : '#e5e7eb'}`,
        borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: isSel ? 700 : 600, color: isSel ? '#0f2d3d' : '#111827', lineHeight: 1.3 }}>
          {label}
        </div>
        {(dims || uom || sku) && (
          <div style={{ marginTop: '3px', fontSize: '12px', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {dims && <span>{dims}</span>}
            {uom && <span style={{ fontWeight: 700, letterSpacing: '0.05em', color: isSel ? '#185D7A' : '#6b7280' }}>{uom}</span>}
            {sku && <span style={{ fontFamily: 'monospace', background: isSel ? '#d4ecf5' : '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>{sku}</span>}
          </div>
        )}
      </div>
      <Checkbox checked={isSel} />
    </button>
  )
}

// ── Profile group (collapsible when a key exists) ──────────────────────────

function ProfileGroupBlock({
  groupKey, systemName, showSystemName, items, defaultOpen, selected, onToggle,
}: {
  groupKey: string
  systemName: string
  showSystemName: boolean
  items: { label: string; profile: WidgetProfile }[]
  defaultOpen: boolean
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!groupKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map(({ label, profile }) => (
          <ProfileRow key={profile.id} label={label} profile={profile} selected={selected} onToggle={onToggle} />
        ))}
      </div>
    )
  }

  const fmtKey     = formatGroupKey(groupKey)
  const displayKey = showSystemName ? `${systemName} ${fmtKey}` : fmtKey

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '10px 0 8px', textAlign: 'left', minHeight: '44px',
        }}
      >
        <span style={{
          fontSize: '13px', fontWeight: 700, color: '#111827',
          paddingLeft: '10px', borderLeft: '3px solid #185D7A',
          marginRight: '6px',
        }}>
          {displayKey}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#185D7A', flexShrink: 0 }}>
          {open ? '▲' : `▼ ${items.length}`}
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '4px' }}>
          {items.map(({ label, profile }) => (
            <ProfileRow key={profile.id} label={label} profile={profile} selected={selected} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profiles section ───────────────────────────────────────────────────────

function ProfilesSection({
  profiles, systemName, selected, onToggle,
}: {
  profiles: WidgetProfile[]
  systemName: string
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  if (profiles.length === 0) return null
  const groups      = groupProfiles(profiles)
  const defaultOpen = profiles.length <= 3
  const multiGroup  = groups.length > 1
  const useHeaders  = multiGroup || !defaultOpen

  return (
    <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: '#6b7280', marginBottom: '10px',
      }}>
        Profiles · {profiles.length} variant{profiles.length !== 1 ? 's' : ''}
      </div>
      {!multiGroup && (
        <div style={{
          fontSize: '13px', fontWeight: 700, color: '#111827',
          paddingLeft: '10px', borderLeft: '3px solid #185D7A',
          marginBottom: '8px',
        }}>
          {!useHeaders && groups[0]?.key
            ? `${systemName} ${formatGroupKey(groups[0].key)}`
            : systemName}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {!useHeaders ? (
          groups.flatMap(({ items }) => items).map(({ label, profile }) => (
            <ProfileRow key={profile.id} label={label} profile={profile} selected={selected} onToggle={onToggle} />
          ))
        ) : (
          groups.map(({ key, items }) => (
            <ProfileGroupBlock
              key={key || '__all__'}
              groupKey={key}
              systemName={systemName}
              showSystemName={multiGroup}
              items={items}
              defaultOpen={defaultOpen}
              selected={selected}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Attribute pills ────────────────────────────────────────────────────────

function AttributePills({ system }: { system: WidgetSystem }) {
  const pills: { label: string; bg: string; text: string; border: string }[] = []

  if (system.moisture_resistant)
    pills.push({ label: 'Moisture Resistant', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' })
  if (system.bal_rating)
    pills.push({ label: system.bal_rating, bg: '#fffbeb', text: '#b45309', border: '#fde68a' })
  if (system.fire_rating)
    pills.push({ label: `FRL ${system.fire_rating}`, bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' })
  if (system.acoustic_rating)
    pills.push({ label: system.acoustic_rating, bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' })
  if (system.structural_grade)
    pills.push({ label: system.structural_grade, bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' })
  if (system.australian_made)
    pills.push({ label: 'Australian Made', bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' })
  if (system.double_sided)
    pills.push({ label: 'Double Sided', bg: '#f9fafb', text: '#374151', border: '#d1d5db' })
  if (system.notes?.toLowerCase().includes('primed') || system.notes?.toLowerCase().includes('site paint'))
    pills.push({ label: 'Pre-primed / site painted', bg: '#f8fafc', text: '#475569', border: '#cbd5e1' })

  if (pills.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
      {pills.map((p, i) => (
        <span key={i} style={{
          fontSize: '12px', fontWeight: 600,
          background: p.bg, color: p.text, border: `1px solid ${p.border}`,
          padding: '5px 12px', borderRadius: '20px', lineHeight: 1.4,
        }}>
          {p.label}
        </span>
      ))}
    </div>
  )
}

// ── Components accordion — selectable ─────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  specialist_supplier: 'Specialist supplier',
  trade_merchant: 'Trade merchant',
}

function ComponentItem({ item, selected, onToggle }: {
  item: WidgetComponent
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const id    = item.id
  const isSel = selected.has(id)
  const comp  = item.components!
  const uom   = fmtUom(comp.uom)
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: '10px', width: '100%', textAlign: 'left',
        padding: '11px 12px',
        background: isSel ? '#eef6fa' : '#f9fafb',
        border: `1.5px solid ${isSel ? '#185D7A' : '#e5e7eb'}`,
        borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: isSel ? 700 : 600,
          color: isSel ? '#0f2d3d' : '#111827', lineHeight: 1.35,
        }}>
          {comp.name}
        </div>
        {item.notes && (
          <div style={{ marginTop: '3px', fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
            {item.notes}
          </div>
        )}
        {comp.description && !item.notes && (
          <div style={{ marginTop: '3px', fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
            {comp.description}
          </div>
        )}
        <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {comp.sku && (
            <span style={{
              fontSize: '11px', fontFamily: 'monospace',
              color: '#4b5563', background: isSel ? '#d4ecf5' : '#f3f4f6',
              padding: '2px 6px', borderRadius: '4px', fontWeight: 600,
            }}>
              {comp.sku}
            </span>
          )}
          {uom && (
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
              color: isSel ? '#185D7A' : '#9ca3af',
            }}>
              {uom}
            </span>
          )}
        </div>
      </div>
      <Checkbox checked={isSel} />
    </button>
  )
}

function ComponentsAccordion({
  components, selected, onToggle,
}: {
  components: WidgetComponent[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const visible = components.filter(c => c.components)
  if (visible.length === 0) return null

  const routes = new Set(visible.map(c => c.components?.procurement_route).filter(Boolean))
  const isSplit = routes.has('specialist_supplier') && routes.has('trade_merchant')

  const groups = isSplit
    ? [
        {
          route: 'specialist_supplier',
          label: ROUTE_LABELS.specialist_supplier,
          items: visible.filter(c => c.components?.procurement_route === 'specialist_supplier'),
        },
        {
          route: 'trade_merchant',
          label: ROUTE_LABELS.trade_merchant,
          items: visible.filter(c => c.components?.procurement_route === 'trade_merchant'),
        },
      ].filter(g => g.items.length > 0)
    : [{ route: null, label: '', items: visible }]

  return (
    <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', cursor: 'pointer', textAlign: 'left',
          background: '#eef6fa', border: '1.5px solid #b8d9e8',
          borderRadius: '10px', padding: '12px 14px', minHeight: '48px',
        }}
      >
        <span style={{
          fontSize: '12px', fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: '#185D7A',
        }}>
          Accessories &amp; Components · {visible.length}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#185D7A', flexShrink: 0, marginLeft: '8px' }}>
          {open ? '▲ Hide' : '▼ Show'}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: '10px' }}>
          {isSplit && (
            <div style={{
              marginBottom: '12px',
              padding: '10px 14px',
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#92400e',
              fontWeight: 600,
              lineHeight: 1.5,
            }}>
              This system requires orders from 2 suppliers — your RFQ will be split accordingly.
            </div>
          )}

          {groups.map(({ route, label, items }) => (
            <div key={route ?? 'all'}>
              {isSplit && (
                <div style={{
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#6b7280',
                  marginBottom: '6px', marginTop: '6px',
                  paddingLeft: '4px',
                  borderLeft: '3px solid #d1d5db',
                }}>
                  {label}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: isSplit ? '10px' : 0 }}>
                {items.map((item) => (
                  <ComponentItem key={item.id} item={item} selected={selected} onToggle={onToggle} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── RFQ Enquiry Modal (supplier enquiry form) ──────────────────────────────

function RfqEnquiryModal({
  system, widgetId, supplierName, onClose,
}: {
  system: WidgetSystem
  widgetId: string
  supplierName?: string
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    message: `Hi, I'm interested in ${system.product_code} — ${system.name}. Please get in touch.`,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setSubmitting(true); setError('')
    const { error: dbError } = await supabase.from('rfq_enquiries').insert({
      widget_id: widgetId, system_id: system.id, system_name: system.name,
      product_code: system.product_code, supplier_name: supplierName || null,
      name: form.name.trim(), email: form.email.trim(),
      phone: form.phone.trim() || null, message: form.message.trim() || null,
    })
    if (dbError) { setError('Something went wrong. Please try again.'); setSubmitting(false); return }
    setSubmitted(true); setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: '15px',
    border: '1.5px solid #d1d5db', borderRadius: '10px', outline: 'none',
    background: '#fafafa', color: '#111827', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#ffffff', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>Enquire about this product</h2>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#4b5563' }}>{system.product_code} — {system.name}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '8px', fontSize: '20px', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '12px' }}
            aria-label="Close"
          >×</button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#d1fae5', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>✓</div>
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#111827', margin: '0 0 8px' }}>Enquiry received!</p>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{supplierName || 'The team'} will be in touch soon.</p>
            <button onClick={onClose} style={{ marginTop: '24px', padding: '13px 32px', background: '#185D7A', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Full name <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="Jane Smith" />
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="jane@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="04xx xxx xxx" />
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>}
            <button
              type="submit" disabled={submitting}
              style={{ padding: '14px', background: submitting ? '#6b7280' : '#185D7A', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Sending…' : 'Send enquiry'}
            </button>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, textAlign: 'center' }}>
              Your details will only be shared with {supplierName || 'this supplier'}.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ── System Detail Modal (full product sheet) ───────────────────────────────

function SystemDetailModal({
  system,
  onClose,
  onEnquire,
  mode,
  draftId,
  onAdded,
  manufacturerName,
}: {
  system: WidgetSystem
  onClose: () => void
  onEnquire?: () => void
  mode?: 'enquire' | 'rfq'
  draftId?: string
  onAdded?: (systemId: string, count: number) => void
  manufacturerName?: string
}) {
  const [selectedProfiles,   setSelectedProfiles]   = useState<Set<string>>(new Set())
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set())
  const [selectedBase,       setSelectedBase]       = useState(false)
  const [selectedColour,     setSelectedColour]     = useState<string | null>(null)
  const [adding,  setAdding]  = useState(false)
  const [added,   setAdded]   = useState(false)

  // Stockists (rfq mode only)
  const [stockistsOpen,    setStockistsOpen]    = useState(false)
  const [stockists,        setStockists]        = useState<StockistResult[]>([])
  const [stockistsLoading, setStockistsLoading] = useState(false)
  const [selectedStockist, setSelectedStockist] = useState<StockistResult | null>(null)
  const [postcode,         setPostcode]         = useState('')
  const [postcodeInput,    setPostcodeInput]    = useState('')

  async function loadStockists() {
    if (stockists.length > 0) { setStockistsOpen(o => !o); return }
    setStockistsOpen(true)
    setStockistsLoading(true)
    const { data: ws } = await supabase.from('embed_widget_systems').select('embed_widget_id').eq('system_id', system.id)
    const widgetIds = (ws ?? []).map((w: any) => w.embed_widget_id)
    if (!widgetIds.length) { setStockistsLoading(false); return }
    const { data: widgets } = await supabase.from('embed_widgets').select('supplier_id').in('id', widgetIds).eq('status', 'active')
    const supplierIds = [...new Set((widgets ?? []).map((w: any) => w.supplier_id))]
    if (!supplierIds.length) { setStockistsLoading(false); return }
    const { data } = await supabase.from('suppliers')
      .select('id, name, suburb, state, phone, email, service_postcodes, delivery_info, region')
      .in('id', supplierIds).order('name')
    setStockists((data as StockistResult[]) ?? [])
    setStockistsLoading(false)
  }

  const sortedStockists = postcode.length === 4
    ? [...stockists].sort((a, b) => {
        const aM = matchesPostcode(a.service_postcodes, postcode) ? 1 : 0
        const bM = matchesPostcode(b.service_postcodes, postcode) ? 1 : 0
        return bM - aM
      })
    : stockists

  // Load saved postcode
  useEffect(() => {
    try { const p = sessionStorage.getItem('bq_postcode'); if (p) { setPostcode(p); setPostcodeInput(p) } } catch {}
  }, [])

  const _catRaw = CATEGORY_COLOURS[system.category] ?? { bg: '#f3f4f6', color: '#374151' }
  const cat = { bg: _catRaw.bg, text: _catRaw.color }

  // Escape key + body scroll lock
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function toggleProfile(id: string) {
    setSelectedProfiles(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleComponent(id: string) {
    setSelectedComponents(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleColour(name: string) {
    setSelectedColour(prev => prev === name ? null : name)
  }

  const selCount = selectedProfiles.size + selectedComponents.size + (selectedBase ? 1 : 0)

  async function handleAddToRFQ() {
    if (!draftId || selCount === 0) return
    setAdding(true)
    const items: { name: string; sku: string; desc: string; uom: string; qty: string; procurement_route?: string }[] = []
    const colourStr = selectedColour ? `Colour: ${selectedColour}` : null
    const mfPrefix  = [manufacturerName, system.name].filter(Boolean).join(' — ')

    for (const pid of selectedProfiles) {
      const p = system.system_profiles.find(p => p.id === pid)
      if (!p) continue
      const profileLabel = p.profile_name || p.name || ''
      const dims = fmtDims(p)
      const descParts = [dims || system.description?.slice(0, 80), colourStr].filter(Boolean)
      items.push({
        name: [mfPrefix, profileLabel].filter(Boolean).join(' — '),
        sku: p.product_code || '',
        desc: descParts.join(' · '),
        uom: p.uom || 'ea',
        qty: '1',
        procurement_route: 'specialist_supplier',
      })
    }
    for (const cid of selectedComponents) {
      const sc = system.system_components.find(c => c.id === cid)
      if (!sc?.components) continue
      const comp = sc.components
      const descParts = [comp.description?.slice(0, 80), colourStr].filter(Boolean)
      items.push({
        name: [mfPrefix, comp.name].filter(Boolean).join(' — '),
        sku: comp.sku || '',
        desc: descParts.join(' · '),
        uom: comp.uom || 'ea',
        qty: '1',
        procurement_route: comp.procurement_route ?? undefined,
      })
    }
    if (selectedBase) {
      const descParts = [system.description?.slice(0, 80), colourStr].filter(Boolean)
      items.push({
        name: mfPrefix,
        sku: system.product_code || '',
        desc: descParts.join(' · '),
        uom: 'ea',
        qty: '1',
        procurement_route: 'specialist_supplier',
      })
    }

    try {
      const res = await fetch('/api/add-to-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, items }),
      })
      if (res.ok) {
        setAdded(true)
        setSelectedProfiles(new Set())
        setSelectedComponents(new Set())
        setSelectedBase(false)
        onAdded?.(system.id, items.length)
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff', borderRadius: '18px',
          width: '100%', maxWidth: '620px',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image — gradient overlay with name on image, matching studio SystemCard style */}
        <div style={{
          height: '220px', flexShrink: 0, position: 'relative',
          borderRadius: '18px 18px 0 0', overflow: 'hidden',
          background: system.hero_image_url ? undefined : 'linear-gradient(135deg, #185D7A 0%, #0f3d52 100%)',
        }}>
          {system.hero_image_url && (
            <img src={system.hero_image_url} alt={system.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${(system as any).hero_image_position_x ?? 50}% ${(system as any).hero_image_position_y ?? 50}%` }} />
          )}
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,30,45,0.88) 0%, rgba(15,30,45,0.25) 55%, transparent 100%)' }} />
          {/* Category pill — top left */}
          <span style={{
            position: 'absolute', top: '14px', left: '14px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: cat.bg, color: cat.text,
            padding: '4px 10px', borderRadius: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            {system.category}
          </span>
          {/* Close button — top right */}
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '8px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', lineHeight: 1 }}>×</button>
          {/* Text overlaid on image */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 18px' }}>
            {manufacturerName && (
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>
                {manufacturerName}
              </div>
            )}
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.01em', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
              {system.name}
            </h2>
            {system.product_code && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                {system.product_code}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 24px 28px', flex: 1 }}>
          {system.description && (
            <p style={{ margin: '0 0 0', fontSize: '14px', color: '#374151', lineHeight: 1.65 }}>
              {system.description}
            </p>
          )}

          {/* Colour selection */}
          {system.system_colours.length > 0 && mode === 'rfq' && (
            <div style={{ marginTop: '18px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280' }}>
              Select colour (optional)
            </div>
          )}
          <ColoursSection
            colours={system.system_colours}
            selected={selectedColour}
            onSelect={mode === 'rfq' ? toggleColour : undefined}
          />

          {/* Profiles */}
          <ProfilesSection
            profiles={system.system_profiles}
            systemName={system.name}
            selected={selectedProfiles}
            onToggle={toggleProfile}
          />

          {/* Base system row — fallback when no profiles (rfq mode) */}
          {system.system_profiles.length === 0 && mode === 'rfq' && draftId && (
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: '#6b7280', marginBottom: '10px',
              }}>
                Add to RFQ
              </div>
              <button
                type="button"
                onClick={() => setSelectedBase(b => !b)}
                style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: '10px', width: '100%', textAlign: 'left',
                  padding: '9px 12px',
                  background: selectedBase ? '#eef6fa' : '#f9fafb',
                  border: `1.5px solid ${selectedBase ? '#185D7A' : '#e5e7eb'}`,
                  borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: selectedBase ? 700 : 600,
                    color: selectedBase ? '#0f2d3d' : '#111827', lineHeight: 1.3,
                  }}>
                    {system.name}
                  </div>
                  {(system.product_code || system.dimensions) && (
                    <div style={{ marginTop: '3px', fontSize: '12px', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {system.dimensions && <span>{system.dimensions}</span>}
                      {system.product_code && (
                        <span style={{ fontFamily: 'monospace', background: selectedBase ? '#d4ecf5' : '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>
                          {system.product_code}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Checkbox checked={selectedBase} />
              </button>
            </div>
          )}

          {/* Components */}
          <ComponentsAccordion
            components={system.system_components}
            selected={selectedComponents}
            onToggle={toggleComponent}
          />

          {/* Attribute pills */}
          <AttributePills system={system} />

          {/* Actions */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mode === 'rfq' ? (
              !draftId ? (
                <div style={{
                  padding: '14px 16px', fontSize: '14px', fontWeight: 600,
                  color: '#6b7280', background: '#f9fafb', border: '1.5px solid #e5e7eb',
                  borderRadius: '10px', textAlign: 'center', lineHeight: 1.4,
                }}>
                  Open from{' '}
                  <a href="https://buildquote.com.au/rfq" style={{ color: '#185D7A', textDecoration: 'underline' }}>
                    BuildQuote
                  </a>
                  {' '}to add items to your RFQ
                </div>
              ) : added ? (
                <button
                  onClick={onClose}
                  style={{
                    padding: '14px 16px', fontSize: '14px', fontWeight: 700,
                    color: '#166534', background: '#dcfce7', border: '1.5px solid #bbf7d0',
                    borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#bbf7d0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#dcfce7')}
                >
                  <span>✓ Added to your RFQ</span>
                  <span style={{ opacity: 0.6, fontSize: '13px', fontWeight: 600 }}>— Done ×</span>
                </button>
              ) : (
                <button
                  onClick={handleAddToRFQ}
                  disabled={selCount === 0 || adding}
                  style={{
                    width: '100%', padding: '15px 16px', fontSize: '15px', fontWeight: 700,
                    color: selCount > 0 ? '#ffffff' : '#9ca3af',
                    background: selCount > 0 ? '#185D7A' : '#f3f4f6',
                    border: 'none', borderRadius: '10px',
                    cursor: selCount > 0 ? 'pointer' : 'default',
                    letterSpacing: '0.01em', transition: 'background 0.15s',
                    boxSizing: 'border-box' as const,
                  }}
                >
                  {adding
                    ? 'Adding…'
                    : selCount > 0
                      ? `Add ${selCount} selected to RFQ →`
                      : 'Select profiles or components above'}
                </button>
              )
            ) : (
              // Enquire mode
              <button
                onClick={onEnquire}
                style={{
                  width: '100%', padding: '15px 16px', fontSize: '15px', fontWeight: 700,
                  color: '#ffffff', background: '#185D7A', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', letterSpacing: '0.01em',
                  boxSizing: 'border-box' as const,
                }}
              >
                Enquire about this product
              </button>
            )}

            {(system.install_guide_urls ?? []).map((guide, i) => (
              <a
                key={i}
                href={guide.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '13px 16px', fontSize: '14px', fontWeight: 600,
                  color: '#185D7A', background: '#eef6fa', border: '1.5px solid #b6dcea',
                  borderRadius: '10px', textDecoration: 'none', boxSizing: 'border-box' as const,
                }}
              >
                {guide.label || 'View install guide'}
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10L10 2M10 2H4M10 2V8" stroke="#185D7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ))}
            {system.website_url && (
              <a
                href={system.website_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '13px 16px', fontSize: '14px', fontWeight: 600,
                  color: '#374151', background: '#f9fafb', border: '1.5px solid #d1d5db',
                  borderRadius: '10px', textDecoration: 'none', boxSizing: 'border-box' as const,
                }}
              >
                View on {manufacturerName ?? 'manufacturer'} website
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10L10 2M10 2H4M10 2V8" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            )}

            {mode === 'rfq' && (
              <button
                onClick={loadStockists}
                style={{
                  width: '100%', padding: '13px 16px', fontSize: '14px', fontWeight: 600,
                  color: '#185D7A', background: stockistsOpen ? '#eef6fa' : '#f9fafb',
                  border: '1.5px solid #d1d5db', borderRadius: '10px', cursor: 'pointer',
                  boxSizing: 'border-box' as const, transition: 'background 0.12s',
                }}
              >
                {stockistsOpen ? '▲ Hide stockists' : 'See local stockists'}
              </button>
            )}
          </div>

          {/* Stockists section — rfq mode only */}
          {mode === 'rfq' && stockistsOpen && (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                  Local stockists for {system.name}
                </p>
                {!postcode && (
                  <div style={{ marginBottom: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Enter your postcode to find nearby stockists</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text" inputMode="numeric" maxLength={4}
                        value={postcodeInput}
                        onChange={e => setPostcodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="e.g. 6281"
                        style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                      <button
                        onClick={() => { if (postcodeInput.length === 4) { setPostcode(postcodeInput); try { sessionStorage.setItem('bq_postcode', postcodeInput) } catch {} } }}
                        disabled={postcodeInput.length !== 4}
                        style={{ padding: '8px 14px', background: postcodeInput.length === 4 ? '#185D7A' : '#e5e7eb', color: postcodeInput.length === 4 ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: postcodeInput.length === 4 ? 'pointer' : 'default' }}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                )}
                {stockistsLoading && <p style={{ fontSize: '13px', color: '#9ca3af' }}>Finding stockists…</p>}
                {!stockistsLoading && stockists.length === 0 && (
                  <p style={{ fontSize: '13px', color: '#9ca3af' }}>No registered stockists found for this product yet.</p>
                )}
                {!stockistsLoading && stockists.length > 0 && (
                  <>
                    {draftId && (
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#6b7280' }}>
                        Tick a stockist — their details will pre-fill your RFQ.
                      </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sortedStockists.map(s => {
                        const location = [s.suburb, s.state].filter(Boolean).join(', ')
                        const coversArea = postcode.length === 4 ? matchesPostcode(s.service_postcodes, postcode) : null
                        const badge = coversArea === true
                          ? { text: '✓ Services your area', bg: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.25)' }
                          : coversArea === false
                          ? { text: 'Check service area', bg: 'rgba(245,158,11,0.08)', color: '#b45309', border: '1px solid rgba(245,158,11,0.3)' }
                          : { text: 'Stocks or can supply', bg: 'rgba(24,93,122,0.08)', color: '#185D7A', border: '1px solid rgba(24,93,122,0.2)' }
                        const regionLabel = s.region ? (REGION_LABELS[s.region] ?? s.region) : null
                        const isSelected = selectedStockist?.id === s.id
                        return (
                          <div
                            key={s.id}
                            onClick={() => draftId ? setSelectedStockist(prev => prev?.id === s.id ? null : s) : undefined}
                            style={{
                              background: isSelected ? '#eef6fa' : '#fff',
                              border: isSelected ? '2px solid #185D7A' : '1px solid #e5e7eb',
                              borderRadius: '10px', padding: '12px 14px',
                              cursor: draftId ? 'pointer' : 'default',
                              transition: 'all 0.12s',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{s.name}</p>
                                {location && <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#6b7280' }}>{location}</p>}
                                {s.phone && <a href={`tel:${s.phone}`} onClick={e => e.stopPropagation()} style={{ fontSize: '12px', color: '#185D7A', textDecoration: 'none' }}>{s.phone}</a>}
                              </div>
                              {draftId && (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: isSelected ? '#185D7A' : '#fff', border: isSelected ? '2px solid #185D7A' : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                                  {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                              )}
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '99px', background: badge.bg, color: badge.color, border: badge.border }}>{badge.text}</span>
                              {regionLabel && <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '99px', background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>{regionLabel}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {draftId && selectedStockist && (
                      <a
                        href={`${BUILDQUOTE_URL}/rfq?draft=${draftId}&supplierName=${encodeURIComponent(selectedStockist.name)}${selectedStockist.email ? `&supplierEmail=${encodeURIComponent(selectedStockist.email)}` : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px', padding: '13px 16px', background: '#185D7A', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}
                      >
                        Continue RFQ with {selectedStockist.name} →
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────

export function WidgetClient({
  systems, widgetId, supplierName, mode, draftId, returnHref, manufacturerName,
}: {
  systems: WidgetSystem[]
  widgetId: string
  supplierName?: string
  mode?: 'enquire' | 'rfq'
  draftId?: string
  returnHref?: string
  manufacturerName?: string
}) {
  // Which product detail modal is open
  const [openSystem,    setOpenSystem]    = useState<WidgetSystem | null>(null)
  // Which enquiry form is open (enquire mode)
  const [enquireSystem, setEnquireSystem] = useState<WidgetSystem | null>(null)
  // Track how many items were added per system (for tile badges)
  const [addedBySystem, setAddedBySystem] = useState<Record<string, number>>({})

  const totalAdded = Object.values(addedBySystem).reduce((a, b) => a + b, 0)

  function handleAdded(systemId: string, count: number) {
    setAddedBySystem(prev => ({ ...prev, [systemId]: (prev[systemId] ?? 0) + count }))
  }

  function handleEnquire() {
    if (!openSystem) return
    setEnquireSystem(openSystem)
    setOpenSystem(null)
  }

  return (
    <>
      <style>{`
        .widget-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 560px) {
          .widget-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }
      `}</style>

      {/* Compact tile grid */}
      <div className="widget-grid">
        {systems.map((system) => (
          <SystemCardTile
            key={system.id}
            system={system}
            onClick={() => setOpenSystem(system)}
            addedCount={addedBySystem[system.id] ?? 0}
          />
        ))}
      </div>

      {/* Product detail modal */}
      {openSystem && (
        <SystemDetailModal
          system={openSystem}
          onClose={() => setOpenSystem(null)}
          onEnquire={handleEnquire}
          mode={mode}
          draftId={draftId}
          onAdded={handleAdded}
          manufacturerName={manufacturerName}
        />
      )}

      {/* Enquiry form modal (enquire mode) */}
      {enquireSystem && (
        <RfqEnquiryModal
          system={enquireSystem}
          widgetId={widgetId}
          supplierName={supplierName}
          onClose={() => setEnquireSystem(null)}
        />
      )}

      {/* RFQ mode — sticky footer with running total + return link */}
      {mode === 'rfq' && totalAdded > 0 && returnHref && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: '#185D7A', color: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', gap: '12px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            {totalAdded} item{totalAdded !== 1 ? 's' : ''} added to your RFQ
          </span>
          <a
            href={returnHref}
            style={{
              fontSize: '14px', fontWeight: 700, color: '#ffffff',
              background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)',
              padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', flexShrink: 0,
            }}
          >
            Return to RFQ →
          </a>
        </div>
      )}
    </>
  )
}
