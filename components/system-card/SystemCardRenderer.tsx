'use client'

// Master System Card renderer — ported from the approved BuildQuote v6 card
// (buildquote/components/library/SystemCardUI.tsx) so the Data Studio preview
// renders exactly what the public will see.
//
// Differences from the v6 source (all deliberate, all Studio/static-safe):
//   - Renders from plain props only. No Supabase reads/writes in here.
//   - Plain <img> instead of next/image (static-package friendly).
//   - The v6 favourites heart (builder auth) is omitted — public/anonymous view.
//   - "Request a quote from this stockist" fires the optional onRequestQuote
//     callback instead of calling BuildQuote's draft APIs; the button is hidden
//     when no callback is passed.
// Everything else — layout, profile grouping, component categories, colours,
// attribute pills, guides, "Share System Card", add-to-list — matches v6.

import { useState } from 'react'
import { HeroGallery } from './HeroGallery'
import type {
  SystemCardSystem,
  SystemCardProfile,
  SystemCardColour,
  SystemCardComponentEntry,
  SystemCardStockist,
  SystemCardTracking,
  SystemCardValidation,
  ShoppingListItem,
} from './types'

const FONT_BODY    = "'Barlow', -apple-system, 'Segoe UI', sans-serif"
const FONT_HEADING = "'Barlow Condensed', 'Barlow', sans-serif"

// Strip trailing " System" / " Systems" from display names
function stripSystem(name: string): string {
  return name.replace(/\s+systems?$/i, '').trim()
}

// ── Props ─────────────────────────────────────────────────────────────────────
//
// MFP addition (not in the Data Studio / v6 source): `showStockists`. Trade
// Desk staff ARE the local stockist standing in front of the customer, so
// that whole section (and its "No local stockists listed yet" placeholder)
// is noise there — default true to match upstream behaviour everywhere else.

type Props = {
  system: SystemCardSystem
  stockists?: SystemCardStockist[]
  showStockists?: boolean
  onAddToList?: (items: ShoppingListItem[]) => void
  // Fires instead of BuildQuote's RFQ-draft flow; button hidden when absent.
  onRequestQuote?: (stockist: SystemCardStockist, items: ShoppingListItem[]) => void
  // Absolute URL used by "Share System Card"; falls back to the current page
  // URL when not provided.
  cardUrl?: string
  // Footer line "Validated by <manufacturer> · <date> · v<n>"; hidden when absent.
  validation?: SystemCardValidation | null
  // Share/analytics wiring (tokenised share links, tracked doc clicks).
  tracking?: SystemCardTracking | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDims(p: SystemCardProfile): string {
  const parts: string[] = []
  if (p.length_mm)  parts.push(`${p.length_mm}mm`)
  if (p.width_mm)   parts.push(`${p.width_mm}mm`)
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

function formatGroupKey(key: string): string {
  return /^\d+(\.\d+)?$/.test(key) ? `${key}mm` : key
}

function extractNums(s: string): number[] {
  return (s.match(/\d+(?:\.\d+)?/g) || []).map(Number)
}

// Shared section rhythm — every top-level card section uses the same top gap,
// top padding and divider so the card reads as one even flow.
const sectionBlock: React.CSSProperties = {
  marginTop: '24px',
  paddingTop: '20px',
  borderTop: '1px solid #e2e8f0',
}
const sectionLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#334155',
  marginBottom: '12px',
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

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

// ── Profile grouping ──────────────────────────────────────────────────────────

type ProfileGroupItem = { label: string; profile: SystemCardProfile; idx: number }
type ProfileGroup     = { key: string; items: ProfileGroupItem[] }

function groupProfiles(profiles: SystemCardProfile[]): ProfileGroup[] {
  if (profiles.length === 0) return []

  const names     = profiles.map(p => (p.profile_name || p.name || '').trim())
  const tokenized = names.map(n => n.split(/\s+/))
  const maxLen    = Math.max(...tokenized.map(t => t.length))

  if (names.some(n => n.includes(' — '))) {
    const map = new Map<string, ProfileGroupItem[]>()
    for (let i = 0; i < profiles.length; i++) {
      const sep   = names[i].indexOf(' — ')
      const key   = sep !== -1 ? names[i].slice(0, sep) : ''
      const label = sep !== -1 ? names[i].slice(sep + 3) : names[i]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ label, profile: profiles[i], idx: i })
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  }

  function buildMap(fromEnd: boolean, n: number) {
    const map = new Map<string, ProfileGroupItem[]>()
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
      map.get(key)!.push({ label, profile: profiles[i], idx: i })
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

  const prefixN = findMinN(false)
  const suffixN = findMinN(true)
  const prefixMap = prefixN > 0 ? buildMap(false, prefixN) : null
  const suffixMap = suffixN > 0 ? buildMap(true, suffixN)  : null

  let chosen: Map<string, ProfileGroupItem[]> | null = null
  if (prefixMap && suffixMap) {
    chosen = suffixMap.size < prefixMap.size ? suffixMap : prefixMap
  } else {
    chosen = prefixMap ?? suffixMap
  }

  if (chosen) return Array.from(chosen.entries()).map(([key, items]) => ({ key, items }))
  return [{ key: '', items: profiles.map((p, i) => ({ label: names[i], profile: p, idx: i })) }]
}

// ── Profile row ───────────────────────────────────────────────────────────────

function ProfileRow({ label, profile, idx, selected, onToggle }: {
  label: string
  profile: SystemCardProfile
  idx: number
  selected: Set<number>
  onToggle: (idx: number) => void
}) {
  const isSel = selected.has(idx)
  const dims  = fmtDims(profile)
  const uom   = fmtUom(profile.uom)
  const sku   = profile.product_code

  const labelNums     = extractNums(label)
  const dimsNums      = extractNums(dims)
  const labelOverlaps = labelNums.length > 0 && labelNums.every((n, i) => dimsNums[i] === n)

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: labelOverlaps ? 'center' : 'flex-start',
    justifyContent: 'space-between', gap: '10px', width: '100%', textAlign: 'left',
    padding: '9px 12px',
    background: isSel ? '#eef6fa' : '#f9fafb',
    border: `1.5px solid ${isSel ? '#185D7A' : '#e5e7eb'}`,
    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s',
  }

  // Single-line layout matching shopping list columns: label+dims | SKU | UOM | checkbox
  const displayLabel = labelOverlaps ? dims : label
  const displaySpecs = labelOverlaps ? '' : dims

  return (
    <button type="button" onClick={() => onToggle(idx)} style={{ ...rowStyle, alignItems: 'center' }}>
      {/* Profile / Specs */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: isSel ? 700 : 600, color: isSel ? '#0f2d3d' : '#111827' }}>
          {displayLabel}
        </span>
        {displaySpecs && (
          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{displaySpecs}</span>
        )}
        {profile.description && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{profile.description}</div>
        )}
      </div>
      {/* SKU */}
      {sku && (
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4b5563', background: isSel ? '#d4ecf5' : '#f3f4f6', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
          {sku}
        </span>
      )}
      {/* UOM badge */}
      {uom && (
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: isSel ? '#fff' : '#185D7A', background: isSel ? '#185D7A' : '#eef6fa', border: `1px solid ${isSel ? '#185D7A' : '#b6dcea'}`, padding: '2px 7px', borderRadius: '5px', flexShrink: 0, minWidth: '44px', textAlign: 'center' }}>
          {uom}
        </span>
      )}
      <Checkbox checked={isSel} />
    </button>
  )
}

// ── Profile group block ───────────────────────────────────────────────────────

function ProfileGroupBlock({ groupKey, systemName, showSystemName, items, defaultOpen, selected, onToggle }: {
  groupKey: string
  systemName: string
  showSystemName: boolean
  items: ProfileGroupItem[]
  defaultOpen: boolean
  selected: Set<number>
  onToggle: (idx: number) => void
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!groupKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map(({ label, profile, idx }) => (
          <ProfileRow key={idx} label={label} profile={profile} idx={idx} selected={selected} onToggle={onToggle} />
        ))}
      </div>
    )
  }

  const fmtKey     = formatGroupKey(groupKey)
  const keyAlreadyIn = systemName.toLowerCase().includes(fmtKey.toLowerCase().replace('mm', ''))
  // Some datasets embed the full system name in each profile name, so the
  // group key already reads "System Name 133mm Smooth" — don't prepend again.
  const keyHasSystemName = fmtKey.toLowerCase().startsWith(systemName.toLowerCase())
  const displayKey = showSystemName
    ? (keyAlreadyIn ? systemName : keyHasSystemName ? fmtKey : `${systemName} ${fmtKey}`)
    : fmtKey

  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', background: 'none', border: 'none',
        cursor: 'pointer', padding: '10px 0 8px', textAlign: 'left', minHeight: '44px',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', paddingLeft: '10px', borderLeft: '3px solid #185D7A', marginRight: '6px' }}>
          {displayKey}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#185D7A', flexShrink: 0 }}>
          {open ? '▲' : `▼ ${items.length}`}
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '4px' }}>
          {items.map(({ label, profile, idx }) => (
            <ProfileRow key={idx} label={label} profile={profile} idx={idx} selected={selected} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profiles section ──────────────────────────────────────────────────────────

function ProfilesSection({ profiles, systemName, selected, onToggle }: {
  profiles: SystemCardProfile[]
  systemName: string
  selected: Set<number>
  onToggle: (idx: number) => void
}) {
  if (profiles.length === 0) return null
  const groups      = groupProfiles(profiles)
  const defaultOpen = profiles.length <= 3
  const multiGroup  = groups.length > 1
  const useHeaders  = multiGroup || !defaultOpen

  return (
    <div style={sectionBlock}>
      <div style={sectionLabel}>
        Profiles · {profiles.length} variant{profiles.length !== 1 ? 's' : ''}
      </div>
      {!multiGroup && (
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', paddingLeft: '10px', borderLeft: '3px solid #185D7A', marginBottom: '8px' }}>
          {(() => {
            const key = groups[0]?.key ?? ''
            const fmtKey = formatGroupKey(key)
            const alreadyIn = key && systemName.toLowerCase().includes(fmtKey.toLowerCase())
            return (!useHeaders && key && !alreadyIn) ? `${systemName} ${fmtKey}` : systemName
          })()}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {!useHeaders ? (
          groups.flatMap(({ items }) => items).map(({ label, profile, idx }) => (
            <ProfileRow key={idx} label={label} profile={profile} idx={idx} selected={selected} onToggle={onToggle} />
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

// ── Components section ────────────────────────────────────────────────────────

// A category collapses into a size-variant dropdown when it has several items
// that all share the same leading word (e.g. "DPM 90mm…", "DPM 110mm…"). Returns
// the per-item labels with that shared word stripped, or null if not a family.
function variantLabels(names: string[]): string[] | null {
  if (names.length <= 3) return null
  const firsts = names.map(n => n.split(/\s+/)[0]?.toLowerCase() ?? '')
  if (!firsts[0] || new Set(firsts).size !== 1) return null
  return names.map(n => n.split(/\s+/).slice(1).join(' ').trim() || n)
}

function ComponentRow({ comp, idx, label, selected, onToggle }: {
  comp: SystemCardComponentEntry
  idx: number
  label?: string
  selected: Set<number>
  onToggle: (idx: number) => void
}) {
  const c = comp.components
  const isSel = selected.has(idx)
  return (
    <button type="button" onClick={() => onToggle(idx)} style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '10px', width: '100%', textAlign: 'left', padding: '12px',
      background: isSel ? '#eef6fa' : '#f9fafb',
      border: `1.5px solid ${isSel ? '#185D7A' : '#e5e7eb'}`,
      borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: isSel ? 700 : 600, color: isSel ? '#0f2d3d' : '#111827', lineHeight: 1.3 }}>
          {label ?? c?.name ?? comp.role}
        </div>
        <div style={{ marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {c?.description && (
            <span style={{ fontSize: '12px', color: '#4b5563' }}>{c.description}</span>
          )}
          {c?.sku && (
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4b5563', background: isSel ? '#d4ecf5' : '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>
              {c.sku}
            </span>
          )}
          {fmtUom(c?.uom ?? null) && (
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: isSel ? '#185D7A' : '#6b7280' }}>
              {fmtUom(c?.uom ?? null)}
            </span>
          )}
        </div>
      </div>
      <Checkbox checked={isSel} />
    </button>
  )
}

function ComponentCategoryBlock({ category, items, selected, onToggle }: {
  category: string
  items: { comp: SystemCardComponentEntry; idx: number }[]
  selected: Set<number>
  onToggle: (idx: number) => void
}) {
  const names  = items.map(it => (it.comp.components?.name ?? '').trim())
  const labels = variantLabels(names)
  const family = labels !== null
  // Size-variant families (e.g. DPM widths) start collapsed to save space;
  // categories of distinct products start open.
  const [open, setOpen] = useState(!family)

  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', cursor: 'pointer', textAlign: 'left', background: 'none',
        border: 'none', padding: '10px 2px 8px', minHeight: '40px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#334155', paddingLeft: '10px', borderLeft: '3px solid #185D7A' }}>
          {category}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#185D7A', flexShrink: 0, marginLeft: '8px' }}>
          {open ? '▲' : `▼ ${items.length}`}
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '6px' }}>
          {items.map((it, i) => (
            <ComponentRow key={it.idx} comp={it.comp} idx={it.idx}
              label={labels ? labels[i] : undefined}
              selected={selected} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

function ComponentsSection({ components, selected, onToggle }: {
  components: SystemCardComponentEntry[]
  selected: Set<number>
  onToggle: (idx: number) => void
}) {
  const [open, setOpen] = useState(false)
  if (components.length === 0) return null

  // Group by category, keeping each component's original index (selection is
  // index-based against the flat system_components array).
  const byCat = new Map<string, { comp: SystemCardComponentEntry; idx: number }[]>()
  components.forEach((comp, idx) => {
    const cat = comp.components?.category?.trim() || 'Other'
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat)!.push({ comp, idx })
  })
  // First-appearance order, but push any Service/delivery category to the end.
  const cats = Array.from(byCat.entries()).sort(
    (a, b) => (/service|delivery/i.test(a[0]) ? 1 : 0) - (/service|delivery/i.test(b[0]) ? 1 : 0)
  )

  return (
    <div style={sectionBlock}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', cursor: 'pointer', textAlign: 'left',
        background: '#eef6fa', border: '1.5px solid #b8d9e8',
        borderRadius: '10px', padding: '12px 14px', minHeight: '48px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#185D7A' }}>
          Accessories &amp; Components · {components.length}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#185D7A', flexShrink: 0, marginLeft: '8px' }}>
          {open ? '▲ Hide' : '▼ Show'}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {cats.map(([cat, items]) => (
            <ComponentCategoryBlock key={cat} category={cat} items={items} selected={selected} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Attribute pills ───────────────────────────────────────────────────────────

function AttributePills({ system }: { system: SystemCardSystem }) {
  const badges: { label: string; bg: string; color: string }[] = []

  if (system.bal_rating)         badges.push({ label: system.bal_rating,            bg: '#fff7ed', color: '#c2410c' })
  if (system.fire_rating)        badges.push({ label: `FRL ${system.fire_rating}`,  bg: '#fef2f2', color: '#b91c1c' })
  if (system.moisture_resistant) badges.push({ label: 'Moisture resistant',          bg: '#f0f9ff', color: '#0369a1' })
  if (system.acoustic_rating)    badges.push({ label: system.acoustic_rating,        bg: '#faf5ff', color: '#7e22ce' })
  if (system.structural_grade)   badges.push({ label: system.structural_grade,       bg: '#f0fdf4', color: '#15803d' })
  if (system.australian_made)    badges.push({ label: 'Australian made',             bg: '#f0fdf4', color: '#166534' })
  if (system.notes?.toLowerCase().includes('primed') || system.notes?.toLowerCase().includes('site paint'))
    badges.push({ label: 'Pre-primed / site painted', bg: '#f8fafc', color: '#475569' })
  for (const attr of system.custom_technical_attributes ?? [])
    badges.push({ label: `${attr.label}: ${attr.value}`, bg: '#f8fafc', color: '#334155' })

  if (badges.length === 0) return null

  return (
    <div style={sectionBlock}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {badges.map((b, i) => (
          <span key={i} style={{
            display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 99,
            fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.02em',
            background: b.bg, color: b.color, border: `1px solid ${b.color}33`,
          }}>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Colours section ───────────────────────────────────────────────────────────

function ColoursSection({ colours, selected, onSelect }: {
  colours: SystemCardColour[]
  selected: string | null
  onSelect: (name: string) => void
}) {
  if (colours.length === 0) return null
  return (
    <div style={sectionBlock}>
      <div style={sectionLabel}>
        Select Colour (optional)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {colours.map((c, i) => {
          const isSel = selected === c.colour_name
          return (
            <button key={i} type="button" onClick={() => onSelect(c.colour_name)} style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              fontSize: '13px', fontWeight: isSel ? 700 : 500,
              background: isSel ? '#eef6fa' : '#f8fafc',
              color: isSel ? '#185D7A' : '#374151',
              border: `${isSel ? '2px' : '1px'} solid ${isSel ? '#185D7A' : '#e2e8f0'}`,
              padding: c.image_url ? '4px 10px 4px 4px' : '5px 12px',
              borderRadius: '20px', lineHeight: 1.4, cursor: 'pointer',
              transition: 'all 0.12s',
            }}>
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
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function SystemCardRenderer({ system, stockists = [], showStockists = true, onAddToList, onRequestQuote, cardUrl, validation, tracking }: Props) {
  const [selectedProfiles,   setSelectedProfiles]   = useState<Set<number>>(new Set())
  const [selectedComponents, setSelectedComponents] = useState<Set<number>>(new Set())
  const [selectedColour,     setSelectedColour]     = useState<string | null>(null)
  const [stockistsOpen,      setStockistsOpen]      = useState(false)
  const [postcode,           setPostcode]           = useState('')
  const [justAdded,          setJustAdded]          = useState(0)
  const [cardLinkCopied,     setCardLinkCopied]     = useState(false)
  const [shareChannelDone,   setShareChannelDone]   = useState<string | null>(null)

  const posX = system.hero_image_position_x ?? 50
  const posY = system.hero_image_position_y ?? 50
  const mfrName = system.manufacturer?.name ?? 'manufacturer'

  function toggleProfile(idx: number) {
    setSelectedProfiles(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }
  function toggleComponent(idx: number) {
    setSelectedComponents(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }

  // Build shopping-list items from the current profile/component selections.
  // Shared by "Add to shopping list" and "Request a quote from this stockist".
  function buildSelectedItems(): ShoppingListItem[] {
    const items: ShoppingListItem[] = []

    system.system_profiles.forEach((p, idx) => {
      if (!selectedProfiles.has(idx)) return
      const base = stripSystem(system.name)
      const profileLabel = (p.profile_name || p.name || '').trim()
      // Only append profileLabel if its first word isn't already in the base name
      const firstWord = profileLabel.split(/\s+/)[0]?.toLowerCase() ?? ''
      const alreadyIn = firstWord && base.toLowerCase().includes(firstWord)
      const name = (!alreadyIn && profileLabel) ? `${base} ${profileLabel}` : base
      const dims = fmtDims(p)
      items.push({
        id: `${Date.now()}-p${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        sku: p.product_code ?? '',
        desc: dims,
        uom: fmtUom(p.uom) || 'EA',
        qty: 1,
      })
    })

    system.system_components.forEach((comp, idx) => {
      if (!selectedComponents.has(idx)) return
      const c = comp.components
      items.push({
        id: `${Date.now()}-c${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name: c?.name ?? comp.role,
        sku: c?.sku ?? '',
        desc: c?.description ?? '',
        uom: c?.uom?.toUpperCase() ?? 'EA',
        qty: 1,
      })
    })

    return items
  }

  function handleAddToList() {
    if (!onAddToList) return
    const items = buildSelectedItems()
    if (items.length > 0) {
      onAddToList(items)
      setSelectedProfiles(new Set())
      setSelectedComponents(new Set())
      // Brief green confirmation on the button itself, at the point of click.
      setJustAdded(items.length)
      window.setTimeout(() => setJustAdded(0), 2000)
    }
  }

  // Mint a tokenised /s/<token> share URL (records channel + share opens).
  // Falls back to the canonical/current URL when tracking is absent or the
  // endpoint is unreachable — sharing always works.
  async function mintShareUrl(channel: 'copy' | 'sms' | 'email'): Promise<string> {
    const fallback = tracking
      ? `${tracking.apiBase}/cards/${tracking.manufacturerSlug}/${tracking.cardSlug}`
      : (cardUrl ?? window.location.href).trim()
    if (!tracking) return fallback
    try {
      const res = await fetch(`${tracking.apiBase}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ m: tracking.manufacturerSlug, slug: tracking.cardSlug, channel }),
      })
      if (res.ok) {
        const json = await res.json()
        if (typeof json.url === 'string') return json.url
      }
    } catch { /* untracked fallback */ }
    return fallback
  }

  function shareText(): string {
    const title = stripSystem(system.name)
    return system.manufacturer ? `${title} — ${system.manufacturer.name}` : title
  }

  async function shareViaChannel(channel: 'copy' | 'sms' | 'email') {
    const url = await mintShareUrl(channel)
    if (channel === 'copy') {
      try {
        await navigator.clipboard.writeText(url)
        setShareChannelDone('copy')
        window.setTimeout(() => setShareChannelDone(null), 2000)
      } catch { /* clipboard unavailable */ }
    } else if (channel === 'sms') {
      window.location.href = `sms:?&body=${encodeURIComponent(`${shareText()} ${url}`)}`
    } else {
      window.location.href = `mailto:?subject=${encodeURIComponent(shareText())}&body=${encodeURIComponent(`${shareText()}\n${url}`)}`
    }
  }

  // Route document links through the tracking redirect when wired; the
  // redirect endpoint only accepts this card's known URLs.
  function docHref(url: string, label: string): string {
    if (!tracking) return url
    return `${tracking.apiBase}/api/doc-click` +
      `?m=${encodeURIComponent(tracking.manufacturerSlug)}` +
      `&slug=${encodeURIComponent(tracking.cardSlug)}` +
      `&label=${encodeURIComponent(label)}` +
      `&u=${encodeURIComponent(url)}`
  }

  // Share the whole System Card (distinct from the shopping-list PNG share):
  // native share sheet where available, otherwise copy the share text + link.
  async function shareSystemCard() {
    const url   = (cardUrl ?? window.location.href).trim()
    const title = stripSystem(system.name)
    const byLine = system.manufacturer ? `${title} — ${system.manufacturer.name}` : title
    const full  = system.description?.trim() ?? ''
    // Keep the share text short — cut long descriptions at a word boundary.
    const desc  = full.length > 160
      ? `${full.slice(0, 160).replace(/\s+\S*$/, '')}…`
      : full
    const text  = [byLine, desc].filter(Boolean).join('\n')

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: byLine, text, url })
        return
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return // user closed the sheet
        // Share sheet unavailable/failed — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCardLinkCopied(true)
      window.setTimeout(() => setCardLinkCopied(false), 2000)
    } catch {
      // Last resort — let the user copy manually.
      window.prompt('Copy this link to share the System Card:', url)
    }
  }

  const hasSelections = selectedProfiles.size > 0 || selectedComponents.size > 0
  const totalSelected = selectedProfiles.size + selectedComponents.size

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #d1d9e0',
      borderRadius: '12px',
      overflow: 'hidden',
      fontFamily: FONT_BODY,
    }}>

      {/* Hero — swipeable gallery when the card ships multiple images,
          classic single hero otherwise (HeroGallery handles both). */}
      <HeroGallery
        images={system.gallery_images ?? []}
        fallbackHero={{
          url: system.hero_image_url?.trim() ?? null,
          alt: system.name,
          posX,
          posY,
          zoom: system.hero_image_zoom ?? 1,
        }}
        overlay={(
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px 18px', pointerEvents: 'none' }}>
            {system.manufacturer && (
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>
                {system.manufacturer.name}
              </div>
            )}
            <h1 style={{
              fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#fff',
              margin: 0, lineHeight: 1.15, letterSpacing: '-0.01em',
              fontFamily: FONT_HEADING,
            }}>
              {stripSystem(system.name)}
            </h1>
            {(system.category || system.subcategory) && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                {[system.category, system.subcategory].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        )}
      />

      {/* Body */}
      <div style={{ padding: '20px 20px 24px' }}>

        {system.description && (
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.65, margin: 0 }}>
            {system.description}
          </p>
        )}

        {/* Profile + component count */}
        {(system.system_profiles.length > 0 || system.system_components.length > 0) && (
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>
            {system.system_profiles.length > 0
              ? `${system.system_profiles.length} profile${system.system_profiles.length !== 1 ? 's' : ''}`
              : ''}
            {system.system_profiles.length > 0 && system.system_components.length > 0 ? ' · ' : ''}
            {system.system_components.length > 0
              ? `${system.system_components.length} component${system.system_components.length !== 1 ? 's' : ''}`
              : ''}
          </p>
        )}

        <ColoursSection
          colours={system.system_colours}
          selected={selectedColour}
          onSelect={name => setSelectedColour(prev => prev === name ? null : name)}
        />

        <ProfilesSection
          profiles={system.system_profiles}
          systemName={stripSystem(system.name)}
          selected={selectedProfiles}
          onToggle={toggleProfile}
        />

        <ComponentsSection
          components={system.system_components}
          selected={selectedComponents}
          onToggle={toggleComponent}
        />

        <AttributePills system={system} />

        {/* Action buttons */}
        <div style={{ ...sectionBlock, display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Add to list */}
          {onAddToList && (
            <button
              type="button"
              onClick={handleAddToList}
              disabled={!hasSelections && justAdded === 0}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '13px 16px', fontSize: '14px', fontWeight: 700,
                color: justAdded > 0 ? '#fff' : hasSelections ? '#fff' : '#9ca3af',
                background: justAdded > 0 ? '#16a34a' : hasSelections ? '#185D7A' : '#f1f5f9',
                border: `1.5px solid ${justAdded > 0 ? '#16a34a' : hasSelections ? '#185D7A' : '#e2e8f0'}`,
                borderRadius: '10px', cursor: hasSelections ? 'pointer' : 'default',
                transition: 'all 0.2s', boxSizing: 'border-box',
              }}
            >
              {justAdded > 0 ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  Added {justAdded} item{justAdded !== 1 ? 's' : ''} — see your list below ↓
                </>
              ) : hasSelections
                ? `Add ${totalSelected} item${totalSelected !== 1 ? 's' : ''} to shopping list`
                : 'Select items above to add to your shopping list'}
            </button>
          )}

          {/* Share System Card — share this whole card with a builder,
              architect, supplier, partner or client (not the shopping list) */}
          <button
            type="button"
            onClick={shareSystemCard}
            style={{
              ...ghostLinkStyle, width: '100%', cursor: 'pointer',
              ...(cardLinkCopied
                ? { color: '#166534', background: '#f0fdf4', border: '1.5px solid #86efac' }
                : {}),
            }}
          >
            {cardLinkCopied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                Link copied — ready to paste
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185D7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share System Card
              </>
            )}
          </button>

          {/* Tokenised share links (copy / SMS / email) — only when the card
              is wired for tracking; each mints a /s/<token> URL. */}
          {tracking && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => shareViaChannel('copy')}
                style={{ ...ghostLinkStyle, flex: 1, cursor: 'pointer', padding: '9px 10px', fontSize: '12.5px',
                  ...(shareChannelDone === 'copy' ? { color: '#166534', background: '#f0fdf4', border: '1.5px solid #86efac' } : {}) }}>
                {shareChannelDone === 'copy' ? 'Link copied ✓' : 'Copy link'}
              </button>
              <button type="button" onClick={() => shareViaChannel('sms')}
                style={{ ...ghostLinkStyle, flex: 1, cursor: 'pointer', padding: '9px 10px', fontSize: '12.5px' }}>
                SMS
              </button>
              <button type="button" onClick={() => shareViaChannel('email')}
                style={{ ...ghostLinkStyle, flex: 1, cursor: 'pointer', padding: '9px 10px', fontSize: '12.5px' }}>
                Email
              </button>
            </div>
          )}

          {/* See local stockists — MFP: skipped entirely in Trade Desk context */}
          {showStockists && (stockists.length === 0 ? (
            <span style={{ ...ghostLinkStyle, opacity: 0.5, cursor: 'default', userSelect: 'none' }}>
              No local stockists listed yet
            </span>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setStockistsOpen(o => !o)}
                style={{ ...ghostLinkStyle, width: '100%', cursor: 'pointer' }}
              >
                {stockistsOpen ? 'Hide' : 'See'} local stockist{stockists.length !== 1 ? 's' : ''}
                <span style={{
                  fontSize: '12px', fontWeight: 800, color: '#fff', background: '#185D7A',
                  borderRadius: '20px', padding: '1px 8px', marginLeft: '2px',
                }}>
                  {stockists.length}
                </span>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '2px' }}>
                  <path d={stockistsOpen ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} stroke="#185D7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {stockistsOpen && (() => {
                const validPostcode = /^\d{4}$/.test(postcode)
                // Group by state — WA first, then the rest alphabetically,
                // no-state stockists last. Within a state, the ones servicing
                // the entered postcode float to the top (never hidden).
                const groups = new Map<string, SystemCardStockist[]>()
                for (const s of stockists) {
                  const key = (s.state ?? '').trim().toUpperCase() || 'OTHER'
                  if (!groups.has(key)) groups.set(key, [])
                  groups.get(key)!.push(s)
                }
                const stateOrder = Array.from(groups.keys()).sort((a, b) => {
                  if (a === b) return 0
                  if (a === 'WA') return -1
                  if (b === 'WA') return 1
                  if (a === 'OTHER') return 1
                  if (b === 'OTHER') return -1
                  return a.localeCompare(b)
                })
                return (
                  <div style={{ marginTop: '12px' }}>
                    <input
                      value={postcode}
                      onChange={e => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputMode="numeric"
                      placeholder="Your postcode (optional) — see who services your area"
                      style={{
                        width: '100%', boxSizing: 'border-box', marginBottom: '12px',
                        border: '1.5px solid #d1d9e0', borderRadius: '8px',
                        padding: '10px 12px', fontSize: '13px', color: '#0f172a',
                        outline: 'none', background: '#fff',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#185D7A' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#d1d9e0' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {stateOrder.map(stateKey => {
                        const inState = groups.get(stateKey)!
                        const ordered = validPostcode
                          ? [...inState].sort((a, b) =>
                              Number(b.service_postcodes.includes(postcode)) -
                              Number(a.service_postcodes.includes(postcode)))
                          : inState
                        return (
                          <div key={stateKey}>
                            <div style={{
                              fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: '#64748b', margin: '2px 0 8px',
                            }}>
                              {stateKey === 'OTHER' ? 'Other locations' : stateKey}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {ordered.map(s => (
                                <StockistRow
                                  key={s.id}
                                  stockist={s}
                                  hasSelections={hasSelections}
                                  servesPostcode={validPostcode && s.service_postcodes.includes(postcode)}
                                  onRequestQuote={onRequestQuote
                                    ? () => onRequestQuote(s, buildSelectedItems())
                                    : undefined}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          ))}

          {/* Website + install guides — moved to the bottom of the card
              alongside the other resource links. */}
          {system.website_url?.trim() && (
            <GuideLink href={docHref(system.website_url.trim(), 'Website')} context={`View ${mfrName}`} label="Website" />
          )}
          {(Array.isArray(system.install_guide_urls) ? system.install_guide_urls : []).map((guide, i) => (
            <GuideLink key={i} href={docHref(guide.url, 'Installation guide')} context={`View ${mfrName}`} label="Installation guide" />
          ))}

          {/* Design guide */}
          {system.design_guide_url && (
            <GuideLink href={docHref(system.design_guide_url, 'Design guide')} context={`View ${mfrName}`} label="Design guide" />
          )}

          {/* Tech data */}
          {system.tech_data_url && (
            <GuideLink href={docHref(system.tech_data_url, 'Technical guide')} context={`View ${mfrName}`} label="Technical guide" />
          )}

          {/* Extra named documents (energy ratings, sustainability reports…) —
              the manufacturer-supplied label is the button text. */}
          {(Array.isArray(system.custom_document_links) ? system.custom_document_links : []).map((doc, i) => (
            <GuideLink key={i} href={docHref(doc.url, doc.label || 'Document')} context={`View ${mfrName}`} label={doc.label || 'Document'} />
          ))}

        </div>

        {/* Validation footer — who stands behind this data, when, which version */}
        {validation && (validation.validated_by || validation.validated_at || validation.version != null) && (
          <div style={{
            marginTop: '18px', paddingTop: '12px', borderTop: '1px solid #e2e8f0',
            fontSize: '11.5px', color: '#7d97a3', textAlign: 'center', lineHeight: 1.6,
          }}>
            {validation.validated_by && <>Validated by <strong style={{ color: '#64748b' }}>{validation.validated_by}</strong></>}
            {validation.validated_at && (
              <>{validation.validated_by ? ' · ' : ''}{new Date(validation.validated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</>
            )}
            {validation.version != null && (
              <>{(validation.validated_by || validation.validated_at) ? ' · ' : ''}v{validation.version}</>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const ghostLinkStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '13px 16px', fontSize: '14px', fontWeight: 600,
  color: '#185D7A', background: '#eef6fa', border: '1.5px solid #b6dcea',
  borderRadius: '10px', textDecoration: 'none', boxSizing: 'border-box',
}

// Two-line resource button: small muted context line ("View BQ Compform") over
// a normal-weight resource line ("Installation guide"). Keeps buttons scannable
// and stops the long system name overflowing.
function GuideLink({ href, context, label }: { href: string; context: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      ...ghostLinkStyle, flexDirection: 'column', gap: '1px',
      paddingTop: '9px', paddingBottom: '9px', textAlign: 'center',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#7d97a3' }}>{context}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 700, color: '#185D7A' }}>
        {label}
        <ExternalIcon />
      </span>
    </a>
  )
}

const contactChipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  fontSize: '12.5px', fontWeight: 600, color: '#185D7A',
  background: '#fff', border: '1.5px solid #d1d9e0', borderRadius: '8px',
  padding: '6px 11px', textDecoration: 'none',
}

// Pretty labels for the supplier `region` slug (no lat/lng yet — service-area
// based). Falls back to the raw value for unmapped regions.
const REGION_LABELS: Record<string, string> = {
  sw_wa: 'South West WA',
  perth: 'Perth',
  wa: 'WA',
}

function normaliseUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// ── Stockist row ──────────────────────────────────────────────────────────────

function StockistRow({
  stockist,
  hasSelections,
  servesPostcode,
  onRequestQuote,
}: {
  stockist: SystemCardStockist
  hasSelections: boolean
  servesPostcode: boolean
  onRequestQuote?: () => void
}) {
  const locationBits = [stockist.suburb, stockist.state].filter(Boolean).join(', ')
  const regionLabel = stockist.region ? (REGION_LABELS[stockist.region] ?? stockist.region) : null
  const canRequest = hasSelections && !!onRequestQuote

  return (
    <div style={{ border: '1px solid #d1d9e0', borderRadius: '12px', overflow: 'hidden', background: '#fbfdfe' }}>
      {/* Location map (Google Maps embed) */}
      {stockist.google_maps_url && (
        <div style={{ position: 'relative', height: '150px', background: '#eef2f5' }}>
          <iframe
            src={stockist.google_maps_url}
            title={`${stockist.name} location`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      )}

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', fontFamily: FONT_HEADING }}>
            {stockist.name}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {servesPostcode && (
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#166534', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '20px', padding: '2px 9px' }}>
                ✓ Services your area
              </span>
            )}
            {stockist.confirmed_at && (
              <span
                title="This stockist confirmed they stock or can supply this system"
                style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '2px 9px' }}
              >
                ✓ Confirmed {new Date(stockist.confirmed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {regionLabel && (
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#185D7A', background: '#eef6fa', border: '1px solid #b6dcea', borderRadius: '20px', padding: '2px 9px' }}>
                {regionLabel}
              </span>
            )}
          </div>
        </div>

        {locationBits && (
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>{locationBits}</p>
        )}
        {stockist.opening_hours && (
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
            {stockist.opening_hours}
          </p>
        )}
        {stockist.delivery_info && (
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            {stockist.delivery_info}
          </p>
        )}

        {/* Contact chips */}
        {(stockist.phone || stockist.website_url || stockist.trade_desk_email) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {stockist.phone && (
              <a href={`tel:${stockist.phone.replace(/\s+/g, '')}`} style={contactChipStyle}>
                {stockist.phone}
              </a>
            )}
            {stockist.website_url && (
              <a href={normaliseUrl(stockist.website_url)} target="_blank" rel="noopener noreferrer" style={contactChipStyle}>
                Website
                <ExternalIcon />
              </a>
            )}
            {stockist.trade_desk_email && (
              <a href={`mailto:${stockist.trade_desk_email}`} style={contactChipStyle}>
                Trade desk
              </a>
            )}
          </div>
        )}

        {/* RFQ action — only rendered when the host app wires a handler */}
        {onRequestQuote && (
          <button
            type="button"
            onClick={onRequestQuote}
            disabled={!canRequest}
            style={{
              marginTop: '12px', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '12px 16px', fontSize: '14px', fontWeight: 700,
              color: canRequest ? '#ffffff' : '#9ca3af',
              background: canRequest ? '#185D7A' : '#f1f5f9',
              border: `1.5px solid ${canRequest ? '#185D7A' : '#e2e8f0'}`,
              borderRadius: '10px',
              cursor: canRequest ? 'pointer' : 'default',
              boxSizing: 'border-box',
            }}
          >
            {!hasSelections
              ? 'Select items above to request a quote'
              : 'Request a quote from this stockist'}
          </button>
        )}
      </div>
    </div>
  )
}

function ExternalIcon({ color = '#185D7A' }: { color?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
      <path d="M2 10L10 2M10 2H4M10 2V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
