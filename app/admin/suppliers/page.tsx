'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// Set NEXT_PUBLIC_ADMIN_PASSWORD in your Vercel environment variables to change this
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'
const SESSION_KEY = 'bq_admin_auth'

type Manufacturer = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  website_url: string | null
}

type System = {
  id: string
  name: string
  product_code: string
  category: string
  subcategory: string | null
  sort_order: number
}

type EmbedWidgetSystem = {
  systems: { name: string; product_code: string }
}

type EmbedWidget = {
  id: string
  public_token: string
  status: string
  embed_widget_systems: EmbedWidgetSystem[]
}

type Supplier = {
  id: string
  name: string
  suburb: string | null
  state: string | null
  website_url: string | null
  email: string | null
  phone: string | null
  embed_widgets: EmbedWidget[]
}

type Step = 1 | 2 | 3 | 4

const AU_STATES = ['WA', 'VIC', 'NSW', 'QLD', 'SA', 'TAS', 'ACT', 'NT']
const CATEGORIES = ['Decking', 'Cladding', 'Screening & Fencing']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function buildEmbedCode(token: string, origin: string) {
  return `<iframe src="${origin}/widget/${token}" width="100%" height="800" frameborder="0" style="border:none;border-radius:12px;"></iframe>`
}

function downloadInstructions(supplierName: string, embedCode: string, previewUrl: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NewTech Wood Widget — Setup Instructions for ${supplierName}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 24px; color: #1f2937; line-height: 1.6; }
  h1 { font-size: 24px; color: #111827; margin-bottom: 4px; }
  h2 { font-size: 18px; color: #111827; margin-top: 36px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  h3 { font-size: 15px; color: #374151; margin-top: 20px; margin-bottom: 6px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
  .code-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; word-break: break-all; line-height: 1.6; margin: 12px 0; }
  .step { background: #f9fafb; border-left: 4px solid #2d5a42; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 12px 0; }
  .tip { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin: 12px 0; }
  .platform { margin: 16px 0; }
  footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>

<h1>NewTech Wood Product Widget</h1>
<p class="subtitle">Setup instructions prepared for <strong>${supplierName}</strong> by BuildQuote</p>

<h2>What is this widget?</h2>
<p>This is a live product display widget that shows the NewTech Wood profiles your business stocks. It automatically displays product details, colour options, and fixing components — all kept up to date by the BuildQuote platform.</p>
<p>Customers visiting your website can browse the products, see available colours, and click through to the NewTech Wood website for full specifications.</p>

<h2>Your embed code</h2>
<p>Copy the code below and paste it into your website wherever you want the widget to appear.</p>
<div class="code-box">${embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
<p><strong>Preview your widget:</strong> <a href="${previewUrl}" target="_blank">${previewUrl}</a></p>

<div class="tip">
  💡 <strong>Tip:</strong> You can adjust the <code>height="800"</code> value to make the widget taller or shorter to suit your page layout.
</div>

<h2>How to add to your website</h2>

<div class="platform">
  <h3>WordPress</h3>
  <div class="step">
    <ol>
      <li>Go to the page or post where you want the widget.</li>
      <li>Click the <strong>+</strong> button to add a block.</li>
      <li>Search for and insert a <strong>Custom HTML</strong> block.</li>
      <li>Paste your embed code into the block.</li>
      <li>Click <strong>Update</strong> or <strong>Publish</strong>.</li>
    </ol>
  </div>
</div>

<div class="platform">
  <h3>Squarespace</h3>
  <div class="step">
    <ol>
      <li>Open the page editor and click <strong>Add Block</strong>.</li>
      <li>Select the <strong>Code</strong> block.</li>
      <li>Paste your embed code into the code block.</li>
      <li>Save and publish the page.</li>
    </ol>
  </div>
</div>

<div class="platform">
  <h3>Wix</h3>
  <div class="step">
    <ol>
      <li>In the Wix editor, click <strong>Add</strong> → <strong>Embed</strong> → <strong>Embed a Widget</strong>.</li>
      <li>Click <strong>Enter Code</strong> and paste your embed code.</li>
      <li>Resize the embed block to fit your layout.</li>
      <li>Publish the page.</li>
    </ol>
  </div>
</div>

<div class="platform">
  <h3>Shopify</h3>
  <div class="step">
    <ol>
      <li>Go to <strong>Online Store</strong> → <strong>Pages</strong> and open the page.</li>
      <li>Click the <strong>&lt;&gt;</strong> (source code) button in the editor toolbar.</li>
      <li>Paste your embed code where you want the widget to appear.</li>
      <li>Click <strong>Save</strong>.</li>
    </ol>
  </div>
</div>

<div class="platform">
  <h3>Plain HTML website</h3>
  <div class="step">
    <ol>
      <li>Open the HTML file for the page where you want the widget.</li>
      <li>Paste your embed code inside the <code>&lt;body&gt;</code> tag.</li>
      <li>Save and upload the file to your web server.</li>
    </ol>
  </div>
</div>

<div class="tip">
  🔒 <strong>Note:</strong> Your embed code is unique to your business. Keep it private and do not share it publicly. The widget will only show the products you stock.
</div>

<h2>Need help?</h2>
<p>If you have trouble adding the widget to your website, or want to update which products are displayed, please contact BuildQuote:</p>
<ul>
  <li>Email: <a href="mailto:hello@buildquote.com.au">hello@buildquote.com.au</a></li>
  <li>Website: <a href="https://buildquote.com.au" target="_blank">buildquote.com.au</a></li>
</ul>

<footer>
  Generated by BuildQuote · mfp.buildquote.com.au · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
</footer>

</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `NewTechWood-Widget-Instructions-${slugify(supplierName)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Progress bar ──────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const steps = ['Supplier details', 'Manufacturer', 'Products', 'Done']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const done = step > n
        const active = step === n
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                done ? 'bg-success text-white' : active ? 'bg-brand text-white' : 'bg-ui text-text-faint'
              }`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-text-primary font-medium' : 'text-text-faint'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${done ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Copy button ───────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-sm px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function SuppliersAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const [step, setStep] = useState<Step>(1)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [systems, setSystems] = useState<System[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [origin, setOrigin] = useState('')

  // Step 1 — supplier fields
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [suburb, setSuburb] = useState('')
  const [stateVal, setStateVal] = useState('')

  // Step 2
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null)

  // Step 3
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])

  // Step 4 result
  const [newWidget, setNewWidget] = useState<{ token: string; supplierName: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auth check on mount
  useEffect(() => {
    setOrigin(window.location.origin)
    if (sessionStorage.getItem(SESSION_KEY) === ADMIN_PASSWORD) setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) loadData()
  }, [authed])

  async function loadData() {
    setLoadingData(true)
    const [mfRes, suppliersRes] = await Promise.all([
      supabase.from('manufacturers').select('id, name, slug, logo_url, description, website_url').order('name'),
      supabase.from('suppliers').select(`
        id, name, suburb, state, website_url, email, phone,
        embed_widgets (
          id, public_token, status,
          embed_widget_systems ( systems ( name, product_code ) )
        )
      `).order('name'),
    ])
    if (mfRes.data) setManufacturers(mfRes.data)
    if (suppliersRes.data) setSuppliers(suppliersRes.data as unknown as Supplier[])
    setLoadingData(false)
  }

  async function loadSystems(manufacturerId: string) {
    const { data } = await supabase
      .from('systems')
      .select('id, name, product_code, category, subcategory, sort_order')
      .eq('manufacturer_id', manufacturerId)
      .order('sort_order')
    if (data) setSystems(data)
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, ADMIN_PASSWORD)
      setAuthed(true)
    } else {
      setPasswordError(true)
      setTimeout(() => setPasswordError(false), 2000)
    }
  }

  function goStep2() {
    if (!name.trim()) return setError('Business name is required')
    setError(null)
    setStep(2)
  }

  function goStep3(mf: Manufacturer) {
    setSelectedManufacturer(mf)
    setSelectedSystems([])
    loadSystems(mf.id)
    setStep(3)
  }

  function toggleSystem(id: string) {
    setSelectedSystems(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  async function handleCreate() {
    if (selectedSystems.length === 0) return setError('Select at least one product')
    if (!selectedManufacturer) return
    setSubmitting(true)
    setError(null)

    // 1. Insert supplier
    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .insert({
        name: name.trim(),
        slug: slugify(name),
        website_url: website.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        suburb: suburb.trim() || null,
        state: stateVal || null,
      })
      .select().single()

    if (supErr || !supplier) { setError(supErr?.message || 'Failed to create supplier'); setSubmitting(false); return }

    // 2. Insert embed_widget
    const { data: widget, error: widErr } = await supabase
      .from('embed_widgets')
      .insert({ manufacturer_id: selectedManufacturer.id, supplier_id: supplier.id, status: 'active' })
      .select().single()

    if (widErr || !widget) { setError(widErr?.message || 'Failed to create widget'); setSubmitting(false); return }

    // 3. Link systems
    const { error: sysErr } = await supabase
      .from('embed_widget_systems')
      .insert(selectedSystems.map((sid, i) => ({ embed_widget_id: widget.id, system_id: sid, sort_order: i })))

    if (sysErr) { setError(sysErr.message); setSubmitting(false); return }

    setNewWidget({ token: widget.public_token, supplierName: name.trim() })
    setStep(4)
    setSubmitting(false)
    loadData()
  }

  function resetWizard() {
    setStep(1)
    setName(''); setWebsite(''); setEmail(''); setPhone(''); setSuburb(''); setStateVal('')
    setSelectedManufacturer(null); setSelectedSystems([]); setNewWidget(null); setError(null)
  }

  // ── Password gate ─────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-2xl font-semibold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <p className="text-text-faint text-sm mt-2">Supplier Admin</p>
          </div>
          <form onSubmit={handleLogin} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                autoFocus
                className={`w-full bg-ui border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand transition-colors ${
                  passwordError ? 'border-error' : 'border-border'
                }`}
                placeholder="Enter admin password"
              />
              {passwordError && <p className="text-error text-xs mt-1">Incorrect password</p>}
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Authed layout ─────────────────────────────────────────────────────────

  const embedCode = newWidget ? buildEmbedCode(newWidget.token, origin) : ''
  const previewUrl = newWidget ? `${origin}/widget/${newWidget.token}` : ''

  return (
    <div className="min-h-screen bg-page">

      {/* Nav */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <span className="text-text-faint text-sm">/</span>
            <span className="text-text-primary font-semibold text-sm">Supplier Admin</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}
            className="text-xs text-text-faint hover:text-text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* ── ADD NEW SUPPLIER (wizard) ── */}
        <section className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">Add new supplier</h2>
          <StepBar step={step} />

          {/* Step 1 — Supplier details */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Business name <span className="text-error">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Bunbury Timber & Hardware"
                    className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Website</label>
                  <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com.au" type="url"
                    className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="enquiries@example.com.au" type="email"
                    className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08 9999 0000" type="tel"
                    className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Suburb</label>
                  <input value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="Bunbury"
                    className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">State</label>
                  <select value={stateVal} onChange={e => setStateVal(e.target.value)}
                    className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand">
                    <option value="">Select state</option>
                    {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-error text-sm">{error}</p>}
              <div className="flex justify-end">
                <button onClick={goStep2}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold text-sm transition-colors">
                  Next: Choose manufacturer →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Choose manufacturer */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-text-secondary text-sm">
                Select the manufacturer whose products this supplier stocks.
              </p>
              {loadingData ? (
                <p className="text-text-faint text-sm">Loading...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {manufacturers.map(mf => (
                    <button
                      key={mf.id}
                      onClick={() => goStep3(mf)}
                      className="text-left p-5 bg-ui border border-border hover:border-brand rounded-xl transition-colors group"
                    >
                      <div className="font-semibold text-text-primary group-hover:text-brand transition-colors">
                        {mf.name}
                      </div>
                      {mf.description && (
                        <p className="text-text-faint text-xs mt-1 line-clamp-2">{mf.description}</p>
                      )}
                      <div className="mt-3 text-brand text-xs font-medium">Select →</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-start">
                <button onClick={() => setStep(1)} className="text-sm text-text-faint hover:text-text-primary transition-colors">
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Choose products */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-text-secondary text-sm">
                    Select all the <strong className="text-text-primary">{selectedManufacturer?.name}</strong> products this supplier stocks.
                  </p>
                </div>
                {selectedSystems.length > 0 && (
                  <span className="text-brand text-sm font-medium">{selectedSystems.length} selected</span>
                )}
              </div>

              {CATEGORIES.map(cat => {
                const catSystems = systems.filter(s => s.category === cat)
                if (catSystems.length === 0) return null
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-2">{cat}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catSystems.map(sys => {
                        const isSelected = selectedSystems.includes(sys.id)
                        return (
                          <button
                            key={sys.id}
                            type="button"
                            onClick={() => toggleSystem(sys.id)}
                            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                              isSelected
                                ? 'bg-brand-subtle border-brand'
                                : 'bg-ui border-border hover:border-brand/60'
                            }`}
                          >
                            <span className="font-mono text-xs text-text-faint block mb-0.5">{sys.product_code}</span>
                            <span className={`font-medium text-sm ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {sys.name}
                            </span>
                            {sys.subcategory && <span className="text-text-faint text-xs block">{sys.subcategory}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {error && <p className="text-error text-sm">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(2)} className="text-sm text-text-faint hover:text-text-primary transition-colors">
                  ← Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={submitting || selectedSystems.length === 0}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  {submitting ? 'Creating...' : `Create widget with ${selectedSystems.length || '0'} product${selectedSystems.length !== 1 ? 's' : ''} →`}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Success */}
          {step === 4 && newWidget && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✓</div>
                <h3 className="text-xl font-bold text-text-primary">Widget created!</h3>
                <p className="text-text-faint text-sm mt-1">
                  Ready for <strong className="text-text-secondary">{newWidget.supplierName}</strong>
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Embed code — paste this into their website</p>
                <div className="bg-page rounded-lg p-4 font-mono text-xs text-text-secondary break-all leading-relaxed border border-border">
                  {embedCode}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <CopyButton text={embedCode} label="Copy embed code" />
                <button
                  onClick={() => downloadInstructions(newWidget.supplierName, embedCode, previewUrl)}
                  className="text-sm px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors"
                >
                  Download instructions
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors"
                >
                  Preview widget ↗
                </a>
              </div>

              <div className="pt-2 border-t border-border">
                <button onClick={resetWizard} className="text-sm text-brand hover:underline">
                  + Add another supplier
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── EXISTING SUPPLIERS ── */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-5">
            Active suppliers
            <span className="ml-2 text-sm font-normal text-text-faint">({suppliers.length})</span>
          </h2>

          {loadingData ? (
            <p className="text-text-faint text-sm">Loading...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-text-faint text-sm">No suppliers yet.</p>
          ) : (
            <div className="space-y-4">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-4">
                    <span className="font-semibold text-text-primary">{supplier.name}</span>
                    {(supplier.suburb || supplier.state) && (
                      <span className="text-text-faint text-sm">{[supplier.suburb, supplier.state].filter(Boolean).join(', ')}</span>
                    )}
                    {supplier.email && <span className="text-text-faint text-sm">{supplier.email}</span>}
                    {supplier.phone && <span className="text-text-faint text-sm">{supplier.phone}</span>}
                    {supplier.website_url && (
                      <a href={supplier.website_url} target="_blank" rel="noopener noreferrer" className="text-brand text-sm hover:underline">
                        {supplier.website_url}
                      </a>
                    )}
                  </div>

                  {supplier.embed_widgets.map(widget => {
                    const profiles = widget.embed_widget_systems.map(ews => ews.systems)
                    const code = buildEmbedCode(widget.public_token, origin)
                    return (
                      <div key={widget.id} className="bg-ui rounded-lg p-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {profiles.map((sys, i) => (
                            <span key={i} className="text-xs bg-brand-subtle text-brand-bright px-2.5 py-1 rounded-full font-medium">
                              {sys.product_code} — {sys.name}
                            </span>
                          ))}
                        </div>
                        <div className="font-mono text-xs text-text-faint bg-page rounded px-3 py-2.5 break-all mb-3 leading-relaxed">
                          {code}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <CopyButton text={code} label="Copy embed code" />
                          <button
                            onClick={() => downloadInstructions(supplier.name, code, `${origin}/widget/${widget.public_token}`)}
                            className="text-xs px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors"
                          >
                            Download instructions
                          </button>
                          <a
                            href={`/widget/${widget.public_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors"
                          >
                            Preview ↗
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
