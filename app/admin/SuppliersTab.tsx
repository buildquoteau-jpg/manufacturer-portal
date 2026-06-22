'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

type Supplier = {
  id: string
  name: string
  slug: string
  suburb: string | null
  state: string | null
  address: string | null
  website_url: string | null
  email: string | null
  phone: string | null
  auth_user_id: string | null
  created_at: string
}

const AU_STATES = ['WA', 'VIC', 'NSW', 'QLD', 'SA', 'TAS', 'ACT', 'NT']

function Field({ label, value, placeholder, onChange, type = 'text', required }: {
  label: string; value: string; placeholder?: string; onChange: (v: string) => void
  type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Onboarding form
  const [name, setName]             = useState('')
  const [address, setAddress]       = useState('')
  const [suburb, setSuburb]         = useState('')
  const [stateVal, setStateVal]     = useState('')
  const [website, setWebsite]       = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [abn, setAbn]               = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)

  type ContactRow = { name: string; role: string; email: string; phone: string }
  const emptyContact = (): ContactRow => ({ name: '', role: '', email: '', phone: '' })
  const [contacts, setContacts] = useState<ContactRow[]>([emptyContact()])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<{ slug: string; name: string; email: string; password: string } | null>(null)

  // Set login for existing supplier
  const [supLoginOpen, setSupLoginOpen]     = useState<string | null>(null)
  const [supLoginEmail, setSupLoginEmail]   = useState('')
  const [supLoginPass, setSupLoginPass]     = useState('')
  const [supLoginSaving, setSupLoginSaving] = useState(false)
  const [supLoginError, setSupLoginError]   = useState<string | null>(null)
  const [supLoginOk, setSupLoginOk]         = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoadingData(true)
    const { data } = await supabase
      .from('suppliers')
      .select('id, name, slug, suburb, state, address, website_url, email, phone, auth_user_id, created_at')
      .order('name')
    if (data) setSuppliers(data as Supplier[])
    setLoadingData(false)
  }

  function updateContact(i: number, field: keyof ContactRow, value: string) {
    setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())     return setError('Business name is required')
    if (!email.trim())    return setError('Login email is required')
    if (!password.trim()) return setError('Temporary password is required')
    setSubmitting(true); setError(null)

    try {
      const res = await fetch('/api/admin/create-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify({
          name, email, login_password: password,
          address, suburb, state: stateVal, website_url: website, phone, abn,
          contacts: contacts.filter(c => c.name.trim()),
        }),
      })
      let json: Record<string, string> = {}
      try { json = await res.json() } catch { /* non-JSON response */ }
      if (!res.ok) {
        setError(json.error || `Server error (${res.status}) — check Supabase env vars`)
        setSubmitting(false); return
      }
      setSuccess({ slug: json.slug, name: name.trim(), email: email.trim(), password: password.trim() })
      resetForm()
      loadData()
    } catch (err) {
      setError(`Network error — ${err instanceof Error ? err.message : 'please try again'}`)
    }
    setSubmitting(false)
  }

  function resetForm() {
    setName(''); setAddress(''); setSuburb(''); setStateVal(''); setWebsite('')
    setEmail(''); setPhone(''); setAbn(''); setPassword('')
    setContacts([emptyContact()]); setError(null)
  }

  async function handleSetSupplierLogin(supplierId: string) {
    if (!supLoginEmail.trim()) { setSupLoginError('Email is required'); return }
    if (!supLoginPass.trim())  { setSupLoginError('Password is required'); return }
    setSupLoginSaving(true); setSupLoginError(null)
    try {
      const res = await fetch('/api/admin/set-supplier-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify({ supplier_id: supplierId, email: supLoginEmail, password: supLoginPass }),
      })
      const json = await res.json()
      if (!res.ok) { setSupLoginError(json.error || 'Failed to create login'); setSupLoginSaving(false); return }
      setSupLoginOk(true); setSupLoginEmail(''); setSupLoginPass('')
      setSupLoginSaving(false)
      setTimeout(() => { setSupLoginOk(false); setSupLoginOpen(null) }, 2000)
      loadData()
    } catch {
      setSupLoginError('Network error — please try again')
      setSupLoginSaving(false)
    }
  }

  return (
    <div className="space-y-10">

      {/* ── Onboard new supplier ── */}
      <section className="bg-surface border border-border rounded-2xl p-8">
        <h2 className="text-xl font-bold text-text-primary mb-2">Onboard new supplier</h2>
        <p className="text-text-faint text-sm mb-7">
          Creates a supplier record and a login account. The supplier can then log in at{' '}
          <span className="font-mono text-text-secondary">mfp.buildquote.com.au/supplier/login</span>{' '}
          and connect to manufacturers from their dashboard.
        </p>

        {success ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-5 bg-success/10 border border-success/30 rounded-xl">
              <div className="text-success text-2xl">✓</div>
              <div>
                <p className="font-semibold text-text-primary">{success.name} is ready</p>
                <p className="text-text-faint text-sm mt-0.5">
                  Portal: <span className="font-mono text-text-secondary">/supplier/{success.slug}</span>
                </p>
              </div>
            </div>

            <div className="bg-ui rounded-xl p-5 space-y-2 text-sm">
              <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-3">Share with supplier</p>
              <div className="flex gap-2">
                <span className="text-text-faint w-20 flex-shrink-0">Login URL</span>
                <span className="font-mono text-text-secondary text-xs">mfp.buildquote.com.au/supplier/login</span>
              </div>
              <div className="flex gap-2">
                <span className="text-text-faint w-20 flex-shrink-0">Email</span>
                <span className="text-text-primary">{success.email}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-text-faint w-20 flex-shrink-0">Password</span>
                <span className="font-mono text-text-secondary">{success.password}</span>
              </div>
            </div>

            <button onClick={() => setSuccess(null)}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold text-sm transition-colors">
              Onboard another supplier →
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-7">

            {/* Business details */}
            <div>
              <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-4">Business details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Business name" value={name} onChange={setName}
                    placeholder="e.g. Bunbury Timber & Hardware" required />
                </div>
                <div className="sm:col-span-2">
                  <Field label="Street address" value={address} onChange={setAddress} placeholder="123 Main Street" />
                </div>
                <Field label="Suburb" value={suburb} onChange={setSuburb} placeholder="Bunbury" />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">State</label>
                  <select value={stateVal} onChange={e => setStateVal(e.target.value)}
                    className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand">
                    <option value="">Select state</option>
                    {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Field label="Website" value={website} onChange={setWebsite} placeholder="https://example.com.au" type="url" />
                <Field label="Business phone" value={phone} onChange={setPhone} placeholder="08 9999 0000" type="tel" />
                <Field label="ABN / ACN" value={abn} onChange={setAbn} placeholder="12 345 678 901" />
              </div>
            </div>

            {/* Contacts */}
            <div>
              <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-4">Contacts <span className="normal-case font-normal">(optional)</span></p>
              <div className="space-y-3">
                {contacts.map((c, i) => (
                  <div key={i} className="bg-ui rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-faint font-medium">Contact {i + 1}</span>
                      {contacts.length > 1 && (
                        <button type="button" onClick={() => setContacts(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-xs text-error hover:underline">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={c.name} onChange={e => updateContact(i, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                      <input value={c.role} onChange={e => updateContact(i, 'role', e.target.value)}
                        placeholder="Role e.g. Owner, Manager"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                      <input value={c.email} onChange={e => updateContact(i, 'email', e.target.value)}
                        placeholder="Email" type="email"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                      <input value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)}
                        placeholder="Phone" type="tel"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setContacts(prev => [...prev, emptyContact()])}
                  className="text-xs text-brand hover:underline font-medium">
                  + Add another contact
                </button>
              </div>
            </div>

            {/* Portal login */}
            <div>
              <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-4">Portal login</p>
              <p className="text-xs text-text-faint mb-4">
                The supplier will use these credentials to log in. Share the password with them securely — they can reset it via "Forgot password".
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Login email" value={email} onChange={setEmail}
                  placeholder="contact@supplier.com.au" type="email" required />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Temporary password<span className="text-error ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Set a temporary password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-ui border border-border rounded-lg px-3 py-2 pr-10 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors text-xs font-medium">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-error text-sm">{error}</p>}

            <div className="flex items-center gap-4">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors">
                {submitting ? 'Creating account…' : 'Create supplier account →'}
              </button>
              {(name || email) && (
                <button type="button" onClick={resetForm}
                  className="text-sm text-text-faint hover:text-text-primary transition-colors">
                  Clear form
                </button>
              )}
            </div>

          </form>
        )}
      </section>

      {/* ── Active suppliers ── */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-5">
          Active suppliers
          {!loadingData && <span className="ml-2 text-sm font-normal text-text-faint">({suppliers.length})</span>}
        </h2>

        {loadingData ? (
          <p className="text-text-faint text-sm">Loading…</p>
        ) : suppliers.length === 0 ? (
          <p className="text-text-faint text-sm">No suppliers yet.</p>
        ) : (
          <div className="space-y-4">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="bg-surface border border-border rounded-xl p-5">

                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-text-primary">{supplier.name}</p>
                    {(supplier.suburb || supplier.state) && (
                      <p className="text-text-faint text-xs mt-0.5">
                        {[supplier.suburb, supplier.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/supplier/${supplier.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline">
                      View portal ↗
                    </a>
                    {supplier.auth_user_id ? (
                      <span className="text-xs px-2.5 py-1 border border-success/30 bg-success/10 text-success rounded-full font-medium">
                        ✓ Login set
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSupLoginOpen(supLoginOpen === supplier.id ? null : supplier.id)
                          setSupLoginError(null); setSupLoginOk(false)
                          setSupLoginEmail(''); setSupLoginPass('')
                        }}
                        className={`text-xs px-2.5 py-1 border rounded-full font-medium transition-colors ${
                          supLoginOpen === supplier.id
                            ? 'bg-brand text-white border-brand'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                        }`}>
                        {supLoginOpen === supplier.id ? 'Cancel' : '⚠ No login — set one'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-faint mb-3">
                  {supplier.email   && <span>{supplier.email}</span>}
                  {supplier.phone   && <span>{supplier.phone}</span>}
                  {supplier.website_url && <a href={supplier.website_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{supplier.website_url}</a>}
                  <span>Joined {formatDate(supplier.created_at)}</span>
                </div>

                {/* Set login panel */}
                {supLoginOpen === supplier.id && !supplier.auth_user_id && (
                  <div className="mt-3 p-4 bg-ui rounded-xl space-y-3 border border-border">
                    <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">Set portal login</p>
                    <p className="text-xs text-text-faint">
                      Creates a Supabase Auth account for <span className="font-medium text-text-secondary">{supplier.name}</span>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Login email</label>
                        <input value={supLoginEmail} onChange={e => setSupLoginEmail(e.target.value)}
                          placeholder="contact@supplier.com.au" type="email"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
                        <input value={supLoginPass} onChange={e => setSupLoginPass(e.target.value)}
                          placeholder="Initial password" type="password"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                      </div>
                    </div>
                    {supLoginError && <p className="text-error text-xs">{supLoginError}</p>}
                    {supLoginOk    && <p className="text-success text-xs font-medium">✓ Login created — they can now sign in!</p>}
                    <button onClick={() => handleSetSupplierLogin(supplier.id)} disabled={supLoginSaving || supLoginOk}
                      className="text-xs px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
                      {supLoginSaving ? 'Creating login…' : 'Create login →'}
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
