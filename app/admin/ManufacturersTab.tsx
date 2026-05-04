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
  auth_user_id: string | null
  systems: { id: string }[]
}

type CatalogueSource = {
  id: string
  document_name: string
  document_url: string | null
  document_date: string | null
  extracted_at: string
  extracted_by: string | null
  notes: string | null
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
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [mfAbn, setMfAbn]                 = useState('')
  const [mfPhone, setMfPhone]             = useState('')

  // Dynamic contacts
  type ContactRow = { name: string; role: string; email: string; phone: string }
  const emptyContact = (): ContactRow => ({ name: '', role: '', email: '', phone: '' })
  const [mfContacts, setMfContacts] = useState<ContactRow[]>([emptyContact()])

  function updateMfContact(i: number, field: keyof ContactRow, value: string) {
    setMfContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

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

  // Set login for existing manufacturer
  const [loginOpen, setLoginOpen]             = useState<string | null>(null) // manufacturer id
  const [loginEmail, setLoginEmailSet]        = useState('')
  const [loginPassword, setLoginPasswordSet]  = useState('')
  const [loginSaving, setLoginSaving]         = useState(false)
  const [loginError, setLoginError]           = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess]       = useState(false)

  // Catalogue sources
  const [sourcesOpen, setSourcesOpen]         = useState<string | null>(null) // manufacturer id
  const [sourcesMap, setSourcesMap]           = useState<Record<string, CatalogueSource[]>>({})
  const [sourcesLoading, setSourcesLoading]   = useState(false)
  const [srcDocName, setSrcDocName]           = useState('')
  const [srcDocUrl, setSrcDocUrl]             = useState('')
  const [srcDocDate, setSrcDocDate]           = useState('')
  const [srcNotes, setSrcNotes]               = useState('')
  const [srcSaving, setSrcSaving]             = useState(false)
  const [srcError, setSrcError]               = useState<string | null>(null)

  useEffect(() => { loadManufacturers() }, [])

  async function loadManufacturers() {
    setLoading(true)
    const { data } = await supabase
      .from('manufacturers')
      .select('id, name, slug, logo_url, description, website_url, auth_user_id, systems(id)')
      .order('name')
    if (data) setManufacturers(data as unknown as ManufacturerRow[])
    setLoading(false)
  }

  async function handleSetLogin(manufacturerId: string) {
    if (!loginEmail.trim())    { setLoginError('Email is required'); return }
    if (!loginPassword.trim()) { setLoginError('Password is required'); return }
    setLoginSaving(true)
    setLoginError(null)
    const res = await fetch('/api/admin/set-manufacturer-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({ manufacturer_id: manufacturerId, email: loginEmail, password: loginPassword }),
    })
    const json = await res.json()
    if (!res.ok) { setLoginError(json.error); setLoginSaving(false); return }
    setLoginSuccess(true)
    setLoginEmailSet(''); setLoginPasswordSet('')
    setLoginSaving(false)
    setTimeout(() => { setLoginSuccess(false); setLoginOpen(null) }, 2000)
    loadManufacturers()
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
      body: JSON.stringify({ name, slug, logo_url: logoUrl, website_url: website, description, login_email: loginEmail, login_password: loginPassword, abn: mfAbn, phone: mfPhone, contacts: mfContacts.filter(c => c.name.trim()) }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSubmitting(false); return }

    setSuccess(true)
    setName(''); setSlug(''); setWebsite(''); setLogoUrl(''); setDescription('')
    setLoginEmail(''); setLoginPassword(''); setMfAbn(''); setMfPhone('')
    setMfContacts([emptyContact()]); setSlugEdited(false)
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

  async function toggleSources(manufacturerId: string) {
    if (sourcesOpen === manufacturerId) { setSourcesOpen(null); return }
    setSourcesOpen(manufacturerId)
    if (sourcesMap[manufacturerId]) return // already loaded
    setSourcesLoading(true)
    const res = await fetch(`/api/admin/catalogue-sources?manufacturer_id=${manufacturerId}`)
    const json = await res.json()
    if (json.sources) setSourcesMap(prev => ({ ...prev, [manufacturerId]: json.sources }))
    setSourcesLoading(false)
  }

  async function addSource(manufacturerId: string) {
    if (!srcDocName.trim()) { setSrcError('Document name is required'); return }
    setSrcSaving(true); setSrcError(null)
    const res = await fetch('/api/admin/catalogue-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({
        manufacturer_id: manufacturerId,
        document_name: srcDocName,
        document_url: srcDocUrl,
        document_date: srcDocDate,
        notes: srcNotes,
        extracted_by: 'BuildQuote admin',
      }),
    })
    const json = await res.json()
    if (!res.ok) { setSrcError(json.error); setSrcSaving(false); return }
    // Refresh sources for this manufacturer
    setSourcesMap(prev => ({
      ...prev,
      [manufacturerId]: [json.source, ...(prev[manufacturerId] ?? [])],
    }))
    setSrcDocName(''); setSrcDocUrl(''); setSrcDocDate(''); setSrcNotes('')
    setSrcSaving(false)
  }

  async function deleteSource(manufacturerId: string, sourceId: string) {
    if (!confirm('Remove this source document?')) return
    await fetch('/api/admin/catalogue-sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({ id: sourceId }),
    })
    setSourcesMap(prev => ({
      ...prev,
      [manufacturerId]: (prev[manufacturerId] ?? []).filter(s => s.id !== sourceId),
    }))
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

          {/* ABN + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ABN / ACN" value={mfAbn} onChange={setMfAbn} placeholder="12 345 678 901" />
            <Field label="Business phone" value={mfPhone} onChange={setMfPhone} placeholder="08 9999 0000" />
          </div>

          {/* Contacts */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-1">Contacts</p>
            <p className="text-xs text-text-faint mb-3">Owners, directors, key contacts — add as many as needed.</p>
            <div className="space-y-3">
              {mfContacts.map((c, i) => (
                <div key={i} className="bg-ui rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">Contact {i + 1}</span>
                    {mfContacts.length > 1 && (
                      <button type="button" onClick={() => setMfContacts(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-xs text-error opacity-60 hover:opacity-100 transition-opacity">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={c.name} onChange={e => updateMfContact(i, 'name', e.target.value)} placeholder="Full name"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                    <input value={c.role} onChange={e => updateMfContact(i, 'role', e.target.value)} placeholder="Role e.g. Owner, Director"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                    <input value={c.email} onChange={e => updateMfContact(i, 'email', e.target.value)} placeholder="Email" type="email"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                    <input value={c.phone} onChange={e => updateMfContact(i, 'phone', e.target.value)} placeholder="Phone" type="tel"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setMfContacts(prev => [...prev, emptyContact()])}
                className="text-xs text-brand hover:underline font-medium">
                + Add another contact
              </button>
            </div>
          </div>

          {/* Portal login */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-1">Portal login (optional)</p>
            <p className="text-xs text-text-faint mb-3">
              Set an email + password now so the manufacturer can log in immediately.
              You can also add this later by editing the manufacturer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Login email" value={loginEmail} onChange={setLoginEmail} placeholder="contact@manufacturer.com.au" type="email" />
              <Field label="Login password" value={loginPassword} onChange={setLoginPassword} placeholder="Initial password" type="password" />
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
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          {/* Login status badge + button */}
                          {mf.auth_user_id ? (
                            <span className="text-xs px-3 py-1.5 border border-success/30 bg-success/10 text-success rounded-lg font-medium">
                              ✓ Login set
                            </span>
                          ) : (
                            <button
                              onClick={() => { setLoginOpen(loginOpen === mf.id ? null : mf.id); setLoginError(null); setLoginSuccess(false); setLoginEmailSet(''); setLoginPasswordSet('') }}
                              className={`text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors ${loginOpen === mf.id ? 'bg-brand text-white border-brand' : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
                              {loginOpen === mf.id ? 'Cancel' : '⚠ Set login'}
                            </button>
                          )}
                          <button onClick={() => toggleSources(mf.id)}
                            className={`text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors ${sourcesOpen === mf.id ? 'bg-brand text-white border-brand' : 'bg-ui hover:bg-surface-hover border-border text-text-secondary'}`}>
                            Sources {sourcesMap[mf.id]?.length ? `(${sourcesMap[mf.id].length})` : ''}
                          </button>
                          <button onClick={() => openEdit(mf)}
                            className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors">
                            Edit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Set login panel ── */}
                    {loginOpen === mf.id && !mf.auth_user_id && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">Set portal login</p>
                        <p className="text-xs text-text-faint">
                          Creates a Supabase Auth account and links it to {mf.name}. They can then log in at{' '}
                          <span className="font-mono">mfp.buildquote.com.au/manufacturer/login</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Login email</label>
                            <input
                              value={loginEmail}
                              onChange={e => setLoginEmailSet(e.target.value)}
                              placeholder="contact@newtechwood.com.au"
                              type="email"
                              className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
                            <input
                              value={loginPassword}
                              onChange={e => setLoginPasswordSet(e.target.value)}
                              placeholder="Initial password"
                              type="password"
                              className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand"
                            />
                          </div>
                        </div>
                        {loginError   && <p className="text-error text-xs">{loginError}</p>}
                        {loginSuccess && <p className="text-success text-xs font-medium">✓ Login created — they can now sign in!</p>}
                        <button
                          onClick={() => handleSetLogin(mf.id)}
                          disabled={loginSaving || loginSuccess}
                          className="text-xs px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                        >
                          {loginSaving ? 'Creating login…' : 'Create login →'}
                        </button>
                      </div>
                    )}

                    {/* ── Catalogue Sources panel ── */}
                    {sourcesOpen === mf.id && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4">
                        <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">
                          Catalogue Sources
                        </p>
                        <p className="text-xs text-text-faint">
                          Documents this manufacturer's product data was extracted from. Manufacturers can see these to verify data is from current catalogues.
                        </p>

                        {/* Existing sources */}
                        {sourcesLoading ? (
                          <p className="text-xs text-text-faint">Loading...</p>
                        ) : (sourcesMap[mf.id] ?? []).length === 0 ? (
                          <p className="text-xs text-text-faint italic">No sources recorded yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {(sourcesMap[mf.id] ?? []).map(src => (
                              <div key={src.id} className="flex items-start gap-3 bg-ui rounded-lg px-4 py-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                    <span className="text-sm font-medium text-text-primary">{src.document_name}</span>
                                    {src.document_date && (
                                      <span className="text-xs text-text-faint bg-surface px-2 py-0.5 rounded-full border border-border">{src.document_date}</span>
                                    )}
                                  </div>
                                  {src.document_url && (
                                    <a href={src.document_url} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-brand hover:underline truncate block max-w-xs">
                                      {src.document_url} ↗
                                    </a>
                                  )}
                                  {src.notes && <p className="text-xs text-text-faint mt-0.5">{src.notes}</p>}
                                  <p className="text-xs text-text-faint mt-1">
                                    Extracted {new Date(src.extracted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {src.extracted_by ? ` · ${src.extracted_by}` : ''}
                                  </p>
                                </div>
                                <button onClick={() => deleteSource(mf.id, src.id)}
                                  className="text-xs text-error hover:text-error opacity-50 hover:opacity-100 transition-opacity flex-shrink-0">
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add source form */}
                        <div className="bg-ui rounded-lg p-4 space-y-3">
                          <p className="text-xs font-medium text-text-secondary">Add source document</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <input value={srcDocName} onChange={e => setSrcDocName(e.target.value)}
                                placeholder="Document name e.g. Innova Product Range Guide Dec 2025"
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-xs focus:outline-none focus:border-brand" />
                            </div>
                            <input value={srcDocUrl} onChange={e => setSrcDocUrl(e.target.value)}
                              placeholder="URL to PDF (optional)"
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-xs focus:outline-none focus:border-brand" />
                            <input value={srcDocDate} onChange={e => setSrcDocDate(e.target.value)}
                              placeholder="Document date e.g. December 2025"
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-xs focus:outline-none focus:border-brand" />
                            <div className="sm:col-span-2">
                              <input value={srcNotes} onChange={e => setSrcNotes(e.target.value)}
                                placeholder="Notes e.g. Pages 12–34 used for decking systems (optional)"
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-xs focus:outline-none focus:border-brand" />
                            </div>
                          </div>
                          {srcError && <p className="text-error text-xs">{srcError}</p>}
                          <button onClick={() => addSource(mf.id)} disabled={srcSaving}
                            className="text-xs px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
                            {srcSaving ? 'Adding...' : 'Add source →'}
                          </button>
                        </div>
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
