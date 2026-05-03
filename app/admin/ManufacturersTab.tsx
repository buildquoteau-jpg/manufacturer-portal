'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

type ManufacturerRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  website_url: string | null
  systems: { id: string }[]
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function Field({ label, value, placeholder, onChange, type = 'text', hint }: {
  label: string; value: string; placeholder?: string; onChange: (v: string) => void; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      {hint && <p className="text-xs text-text-faint mb-1.5">{hint}</p>}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
    </div>
  )
}

export default function ManufacturersTab() {
  const [manufacturers, setManufacturers] = useState<ManufacturerRow[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [name, setName]             = useState('')
  const [slug, setSlug]             = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [website, setWebsite]       = useState('')
  const [logoUrl, setLogoUrl]       = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  // Edit
  const [editId, setEditId]           = useState<string | null>(null)
  const [editName, setEditName]       = useState('')
  const [editSlug, setEditSlug]       = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editLogo, setEditLogo]       = useState('')
  const [editDesc, setEditDesc]       = useState('')
  const [editSaving, setEditSaving]   = useState(false)
  const [editError, setEditError]     = useState<string | null>(null)

  useEffect(() => { loadManufacturers() }, [])

  async function loadManufacturers() {
    setLoading(true)
    const { data } = await supabase
      .from('manufacturers')
      .select('id, name, slug, logo_url, description, website_url, systems(id)')
      .order('name')
    if (data) setManufacturers(data as unknown as ManufacturerRow[])
    setLoading(false)
  }

  // Auto-generate slug from name unless user has manually edited it
  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(slugify(v))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Name is required')
    if (!slug.trim())  return setError('Slug is required')
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/admin/create-manufacturer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({ name, slug, logo_url: logoUrl, website_url: website, description }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSubmitting(false); return }

    setSuccess(true)
    setName(''); setSlug(''); setWebsite(''); setLogoUrl(''); setDescription(''); setSlugEdited(false)
    setTimeout(() => setSuccess(false), 3000)
    setSubmitting(false)
    loadManufacturers()
  }

  function openEdit(mf: ManufacturerRow) {
    setEditId(mf.id)
    setEditName(mf.name)
    setEditSlug(mf.slug)
    setEditWebsite(mf.website_url ?? '')
    setEditLogo(mf.logo_url ?? '')
    setEditDesc(mf.description ?? '')
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editId) return
    setEditSaving(true)
    setEditError(null)
    const res = await fetch('/api/admin/create-manufacturer', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({ id: editId, name: editName, slug: editSlug, logo_url: editLogo, website_url: editWebsite, description: editDesc }),
    })
    const json = await res.json()
    if (!res.ok) { setEditError(json.error); setEditSaving(false); return }
    setEditId(null)
    setEditSaving(false)
    loadManufacturers()
  }

  return (
    <div className="space-y-10">

      {/* ── Create form ── */}
      <section className="bg-surface border border-border rounded-2xl p-8">
        <h2 className="text-xl font-bold text-text-primary mb-6">Add new manufacturer</h2>
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Brand name <span className="text-error">*</span>
              </label>
              <input value={name} onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. James Hardie"
                className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Slug <span className="text-error">*</span>
              </label>
              <p className="text-xs text-text-faint mb-1.5">Auto-generated — used in URLs. Only lowercase letters, numbers, hyphens.</p>
              <input value={slug}
                onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true) }}
                placeholder="e.g. james-hardie"
                className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm font-mono focus:outline-none focus:border-brand" />
            </div>

            <Field label="Website URL" value={website} onChange={setWebsite} placeholder="https://jameshardie.com.au" type="url" />

            <div className="sm:col-span-2">
              <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl}
                placeholder="https://example.com/logo.png"
                hint="Paste a direct link to the manufacturer's logo image. Leave blank to add later." />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="1–2 sentences about the brand and what they make."
                rows={3}
                className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand resize-none" />
            </div>
          </div>

          {error   && <p className="text-error text-sm">{error}</p>}
          {success && <p className="text-success text-sm font-medium">Manufacturer created successfully.</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
              {submitting ? 'Creating...' : 'Create manufacturer'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Existing manufacturers ── */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-5">
          Manufacturers <span className="ml-2 text-sm font-normal text-text-faint">({manufacturers.length})</span>
        </h2>

        {loading ? <p className="text-text-faint text-sm">Loading...</p>
          : manufacturers.length === 0 ? <p className="text-text-faint text-sm">No manufacturers yet.</p>
          : (
            <div className="space-y-4">
              {manufacturers.map(mf => {
                const systemCount = mf.systems?.length ?? 0
                const isEditing = editId === mf.id
                return (
                  <div key={mf.id} className="bg-surface border border-border rounded-xl p-5">
                    {isEditing ? (
                      /* Edit form */
                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-text-primary">Editing: {mf.name}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="Name" value={editName} onChange={setEditName} />
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
                            <input value={editSlug} onChange={e => setEditSlug(slugify(e.target.value))}
                              className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:border-brand" />
                          </div>
                          <Field label="Website URL" value={editWebsite} onChange={setEditWebsite} type="url" />
                          <Field label="Logo URL" value={editLogo} onChange={setEditLogo} />
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                              className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand resize-none" />
                          </div>
                        </div>
                        {editError && <p className="text-error text-sm">{editError}</p>}
                        <div className="flex gap-3">
                          <button onClick={handleSaveEdit} disabled={editSaving}
                            className="px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                            {editSaving ? 'Saving...' : 'Save changes'}
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="px-4 py-2 text-sm text-text-faint hover:text-text-primary transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display row */
                      <div className="flex flex-wrap items-start gap-4 justify-between">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {mf.logo_url && (
                            <img src={mf.logo_url} alt={mf.name}
                              className="w-12 h-12 object-contain rounded-lg border border-border bg-white flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <span className="font-semibold text-text-primary">{mf.name}</span>
                              <span className="text-xs bg-brand-subtle text-brand-bright px-2.5 py-0.5 rounded-full font-medium">
                                {systemCount} product{systemCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-text-faint mb-1">{mf.slug}</p>
                            {mf.description && <p className="text-sm text-text-secondary line-clamp-2">{mf.description}</p>}
                            {mf.website_url && (
                              <a href={mf.website_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-brand hover:underline mt-1 inline-block">
                                {mf.website_url} ↗
                              </a>
                            )}
                          </div>
                        </div>
                        <button onClick={() => openEdit(mf)}
                          className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors flex-shrink-0">
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
      </section>
    </div>
  )
}
