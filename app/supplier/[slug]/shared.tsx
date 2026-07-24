'use client'

import { useState } from 'react'
import type { ProductionSystem } from '@/components/system-card/adaptProductionSystem'

// ── Types ─────────────────────────────────────────────────────────────────────

export type WidgetRecord = {
  id: string
  name: string
  public_token: string
  status: string
  created_at: string
  embed_widget_systems: {
    system_id: string
    systems: { name: string; product_code: string; manufacturer_id: string }
  }[]
}

export type RfqEnquiry = {
  id: string
  system_name: string | null
  product_code: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  created_at: string
}

export type Manufacturer = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  systems: (ProductionSystem & { sort_order: number })[]
}

export type SupplierData = {
  id: string
  name: string
  slug: string
  address: string | null
  suburb: string | null
  state: string | null
  website_url: string | null
  email: string | null
  phone: string | null
  manager_name: string | null
  bio: string | null
  hero_photo_url: string | null
  hero_photo_y: number | null    // vertical crop 0 (top) – 100 (bottom), default 50
  hero_photo_zoom: number | null // zoom 100 (none) – 200 (2×), default 100
  google_maps_url: string | null
  service_postcodes: string | null   // stored as comma-separated text in DB
  delivery_info: string | null
  first_login: boolean
  auth_user_id: string | null
  created_at: string
  embed_widgets: WidgetRecord[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const AU_STATES = ['WA', 'VIC', 'NSW', 'QLD', 'SA', 'TAS', 'ACT', 'NT']
export const CATEGORIES = [
  'Decking',
  'Cladding',
  'Screening & Fencing',
  'Waterproofing',
  'Interior Linings',
  'Soffit & Eaves',
  'Pergolas & Outdoor Structures',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function buildEmbedCode(token: string, origin: string) {
  return `<iframe src="${origin}/widget/${token}" width="100%" height="800" frameborder="0" style="border:none;border-radius:12px;"></iframe>`
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Shared UI components ──────────────────────────────────────────────────────

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}

export function SectionHeader({ title, onEdit, editing }: { title: string; onEdit?: () => void; editing?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-text-primary">{title}</h2>
      {onEdit && !editing && (
        <button onClick={onEdit} className="text-xs text-brand hover:underline font-medium">Edit</button>
      )}
    </div>
  )
}

export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-border-subtle last:border-0">
      <span className="text-text-faint text-sm w-32 flex-shrink-0">{label}</span>
      <span className="text-text-primary text-sm break-words flex-1">{value}</span>
    </div>
  )
}

export function InputField({
  label, value, onChange, placeholder, type = 'text', textarea,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; textarea?: boolean
}) {
  const cls = 'w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors'
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} className={cls + ' resize-none'} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} className={cls} />
      }
    </div>
  )
}

export function SaveCancel({
  onSave, onCancel, saving, error,
}: {
  onSave: () => void; onCancel: () => void; saving: boolean; error?: string | null
}) {
  return (
    <div className="space-y-2 pt-2">
      {error && <p className="text-error text-xs">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={onCancel} className="text-sm text-text-faint hover:text-text-primary transition-colors">Cancel</button>
      </div>
    </div>
  )
}
