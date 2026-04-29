'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { use } from 'react'

type WidgetRecord = {
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

type RfqEnquiry = {
  id: string
  system_name: string | null
  product_code: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  created_at: string
}

type Manufacturer = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  website_url: string | null
  systems: { id: string }[]
}

type SupplierData = {
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
  it_name: string | null
  it_email: string | null
  portal_password: string | null
  created_at: string
  embed_widgets: WidgetRecord[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildEmbedCode(token: string, origin: string) {
  return `<iframe src="${origin}/widget/${token}" width="100%" height="800" frameborder="0" style="border:none;border-radius:12px;"></iframe>`
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
  footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>NewTech Wood Product Widget</h1>
<p class="subtitle">Setup instructions prepared for <strong>${supplierName}</strong> by BuildQuote</p>
<h2>What is this widget?</h2>
<p>This is a live product display that shows the NewTech Wood profiles your business stocks — product details, colour options, and fixing components, all kept up to date automatically.</p>
<h2>Your embed code</h2>
<p>Copy the code below and paste it into your website where you want the widget to appear.</p>
<div class="code-box">${embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
<p><strong>Preview:</strong> <a href="${previewUrl}" target="_blank">${previewUrl}</a></p>
<div class="tip">💡 You can adjust <code>height="800"</code> to make the widget taller or shorter to suit your layout.</div>
<h2>How to add to your website</h2>
<h3>WordPress</h3>
<div class="step"><ol><li>Edit the page or post.</li><li>Add a <strong>Custom HTML</strong> block.</li><li>Paste your embed code. Click <strong>Update</strong>.</li></ol></div>
<h3>Squarespace</h3>
<div class="step"><ol><li>Edit the page. Add a <strong>Code</strong> block.</li><li>Paste your embed code. Save.</li></ol></div>
<h3>Wix</h3>
<div class="step"><ol><li>Add → Embed → <strong>Embed a Widget</strong>.</li><li>Click <strong>Enter Code</strong> and paste your embed code.</li></ol></div>
<h3>Shopify</h3>
<div class="step"><ol><li>Pages → open your page → click <strong>&lt;&gt;</strong> (source code).</li><li>Paste your embed code. Save.</li></ol></div>
<h3>Webflow</h3>
<div class="step"><ol><li>Open your project in the Webflow Designer.</li><li>Add an <strong>Embed</strong> element (Components → Embed) to your page where you want the widget.</li><li>Paste your embed code into the HTML embed box. Click <strong>Save &amp; Close</strong>.</li><li>Publish your site.</li></ol></div>
<h3>Framer</h3>
<div class="step"><ol><li>On your Framer canvas, insert a new component: click <strong>+</strong> → search for <strong>Embed</strong>.</li><li>In the embed settings panel, paste your embed code.</li><li>Resize the embed block to your preferred height. Publish.</li></ol>
<p style="margin:8px 0 0;font-size:13px;">Alternatively: Insert → <strong>Custom Code</strong> and paste the embed code there.</p></div>
<h3>GoDaddy Website Builder</h3>
<div class="step"><ol><li>Edit your page. Click <strong>Add Section</strong> → <strong>HTML</strong>.</li><li>Paste your embed code. Click <strong>Done</strong>. Save and publish.</li></ol></div>
<h3>Weebly</h3>
<div class="step"><ol><li>Drag an <strong>Embed Code</strong> element onto your page.</li><li>Click <strong>Edit Custom HTML</strong> and paste your embed code. Save.</li></ol></div>
<h3>Next.js / React</h3>
<div class="step"><ol><li>Create a new page file, e.g. <code>app/newtechwood/page.tsx</code>.</li><li>Paste the following code:</li></ol>
<pre style="background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:8px;font-size:12px;overflow-x:auto;margin-top:10px;">export default function NewTechWoodPage() {
  return (
    &lt;main&gt;
      &lt;iframe
        src="${previewUrl}"
        width="100%"
        height="800"
        style={{ border: 'none', borderRadius: '12px' }}
        title="NewTech Wood Products"
      /&gt;
    &lt;/main&gt;
  )
}</pre>
<p style="margin:10px 0 0;font-size:13px;">The page will be live at <code>yoursite.com/newtechwood</code>. Adjust height as needed.</p>
</div>
<h3>Plain HTML</h3>
<div class="step"><ol><li>Open your HTML file. Paste inside the <code>&lt;body&gt;</code> tag where you want the widget. Upload.</li></ol></div>
<h2>Need help?</h2>
<p>Contact BuildQuote: <a href="mailto:hello@buildquote.com.au">hello@buildquote.com.au</a> · <a href="https://buildquote.com.au">buildquote.com.au</a></p>
<footer>Generated by BuildQuote · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</footer>
</body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Widget-Instructions-${slugify(supplierName)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ForgotPassword({ supplierEmail }: { supplierEmail: string | null }) {
  const [open, setOpen]       = useState(false)
  const [sent, setSent]       = useState(false)
  const [sending, setSending] = useState(false)

  async function sendReset() {
    if (!supplierEmail) return
    setSending(true)
    await fetch('/api/supplier/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: supplierEmail }),
    })
    setSent(true)
    setSending(false)
  }

  if (!supplierEmail) return null

  return (
    <div className="text-center pt-1">
      {!open && (
        <button type="button" onClick={() => setOpen(true)}
          className="text-xs text-text-faint hover:text-brand underline-offset-2 hover:underline transition-colors">
          Forgot password?
        </button>
      )}
      {open && !sent && (
        <div className="text-xs text-text-faint space-y-2">
          <p>A reset link will be sent to <span className="font-medium text-text-secondary">{supplierEmail}</span></p>
          <button type="button" onClick={sendReset} disabled={sending}
            className="text-brand hover:underline font-medium">
            {sending ? 'Sending…' : 'Send reset link'}
          </button>
        </div>
      )}
      {sent && (
        <p className="text-xs text-text-faint">Reset link sent — check your email.</p>
      )}
    </div>
  )
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors">
      {copied ? 'Copied!' : label}
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-border-subtle last:border-0">
      <span className="text-text-faint text-sm w-36 flex-shrink-0">{label}</span>
      <span className="text-text-primary text-sm">{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupplierPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [origin, setOrigin] = useState('')
  const [enquiries, setEnquiries] = useState<RfqEnquiry[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])

  // Edit widget products
  type EditState = { widgetId: string; manufacturerId: string }
  type EditSystem = { id: string; name: string; product_code: string; category: string; subcategory: string | null; sort_order: number }
  const [editState, setEditState] = useState<EditState | null>(null)
  const [editSystems, setEditSystems] = useState<EditSystem[]>([])
  const [editSelectedIds, setEditSelectedIds] = useState<string[]>([])
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
    loadSupplier()
  }, [])

  async function loadSupplier() {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        id, name, slug, address, suburb, state, website_url, email, phone,
        manager_name, it_name, it_email, portal_password, created_at,
        embed_widgets (
          id, name, public_token, status, created_at,
          embed_widget_systems ( system_id, systems ( name, product_code, manufacturer_id ) )
        )
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const s = data as unknown as SupplierData
    setSupplier(s)

    const stored = sessionStorage.getItem(`supplier_portal_${slug}`)
    if (stored && s.portal_password && stored === s.portal_password) {
      setAuthed(true)
      loadEnquiries(s)
      loadManufacturers()
    }

    setLoading(false)
  }

  async function loadEnquiries(s: SupplierData) {
    const widgetIds = s.embed_widgets.map(w => w.id)
    if (widgetIds.length === 0) return
    const { data } = await supabase
      .from('rfq_enquiries')
      .select('id, system_name, product_code, name, email, phone, message, created_at')
      .in('widget_id', widgetIds)
      .order('created_at', { ascending: false })
    if (data) setEnquiries(data as RfqEnquiry[])
  }

  async function openEdit(widget: WidgetRecord) {
    const firstEws = widget.embed_widget_systems[0]
    const manufacturerId = firstEws?.systems?.manufacturer_id
    if (!manufacturerId) return
    const currentIds = widget.embed_widget_systems.map(ews => ews.system_id)
    const { data } = await supabase
      .from('systems')
      .select('id, name, product_code, category, subcategory, sort_order')
      .eq('manufacturer_id', manufacturerId)
      .order('sort_order')
    if (data) setEditSystems(data)
    setEditSelectedIds(currentIds)
    setEditState({ widgetId: widget.id, manufacturerId })
    setEditError(null)
  }

  async function saveEdit() {
    if (!editState || !supplier) return
    if (editSelectedIds.length === 0) { setEditError('Select at least one product'); return }
    const stored = sessionStorage.getItem(`supplier_portal_${slug}`) || ''
    setEditSaving(true)
    setEditError(null)
    const res = await fetch('/api/supplier/update-widget-systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widgetId: editState.widgetId,
        systemIds: editSelectedIds,
        supplierSlug: slug,
        password: stored,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setEditError(json.error || 'Save failed'); setEditSaving(false); return }
    setEditState(null)
    setEditSaving(false)
    loadSupplier()
  }

  async function loadManufacturers() {
    const { data } = await supabase
      .from('manufacturers')
      .select('id, name, slug, logo_url, description, website_url, systems ( id )')
      .order('name')
    if (data) setManufacturers(data as unknown as Manufacturer[])
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!supplier?.portal_password) return
    if (passwordInput === supplier.portal_password) {
      sessionStorage.setItem(`supplier_portal_${slug}`, passwordInput)
      setAuthed(true)
      loadEnquiries(supplier)
      loadManufacturers()
    } else {
      setPasswordError(true)
      setTimeout(() => setPasswordError(false), 2000)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="text-text-faint text-sm">Loading...</p>
      </div>
    )
  }

  if (notFound || !supplier) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-text-faint text-sm">Supplier portal not found.</p>
          <p className="text-text-faint text-xs mt-1">Check the URL is correct or contact BuildQuote.</p>
        </div>
      </div>
    )
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
            <p className="text-text-primary font-semibold mt-3">{supplier.name}</p>
            <p className="text-text-faint text-sm mt-1">Supplier Portal</p>
          </div>
          <form onSubmit={handleLogin} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoFocus
                className={`w-full bg-ui border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand transition-colors ${passwordError ? 'border-error' : 'border-border'}`}
                placeholder="Enter your portal password" />
              {passwordError && <p className="text-error text-xs mt-1">Incorrect password.</p>}
            </div>
            <button type="submit"
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold text-sm transition-colors">
              Sign in
            </button>
            <ForgotPassword supplierEmail={supplier.email} />
          </form>
          <p className="text-center text-text-faint text-xs mt-4">
            Need access? Contact <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">BuildQuote</a>
          </p>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const location = [supplier.address, supplier.suburb, supplier.state].filter(Boolean).join(', ')

  // Manufacturer IDs the supplier already has a widget for
  const coveredManufacturerIds = new Set(
    supplier.embed_widgets.flatMap(w =>
      w.embed_widget_systems.map(ews => ews.systems.manufacturer_id)
    )
  )

  return (
    <div className="min-h-screen bg-page">

      {/* Nav */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <span className="text-text-faint text-sm">/</span>
            <span className="text-text-primary font-semibold text-sm">{supplier.name}</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem(`supplier_portal_${slug}`); setAuthed(false) }}
            className="text-xs text-text-faint hover:text-text-primary transition-colors">
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Business details */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-1">{supplier.name}</h2>
          {location && <p className="text-text-faint text-sm mb-5">{location}</p>}
          <div className="divide-y divide-border-subtle">
            <InfoRow label="Website" value={supplier.website_url} />
            <InfoRow label="Email" value={supplier.email} />
            <InfoRow label="Phone" value={supplier.phone} />
            <InfoRow label="Manager" value={supplier.manager_name} />
            <InfoRow label="IT contact" value={supplier.it_name ? `${supplier.it_name}${supplier.it_email ? ` — ${supplier.it_email}` : ''}` : supplier.it_email} />
            <InfoRow label="Member since" value={formatDate(supplier.created_at)} />
          </div>
        </section>

        {/* Widgets */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-text-primary">
              Your widgets
              <span className="ml-2 text-sm font-normal text-text-faint">({supplier.embed_widgets.length})</span>
            </h2>
          </div>

          {supplier.embed_widgets.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <p className="text-text-faint text-sm">No widgets set up yet.</p>
              <p className="text-text-faint text-xs mt-1">Browse available manufacturers below to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {supplier.embed_widgets
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(widget => {
                  const profiles = widget.embed_widget_systems.map(ews => ews.systems)
                  const code = buildEmbedCode(widget.public_token, origin)
                  const previewUrl = `${origin}/widget/${widget.public_token}`
                  return (
                    <div key={widget.id} className="bg-surface border border-border rounded-xl overflow-hidden">

                      {/* Widget header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                        <div>
                          <p className="font-semibold text-text-primary text-sm">
                            {profiles.length} product{profiles.length !== 1 ? 's' : ''} in this widget
                          </p>
                          <p className="text-text-faint text-xs mt-0.5">Created {formatDate(widget.created_at)}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${widget.status === 'active' ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                          {widget.status}
                        </span>
                      </div>

                      {/* Products */}
                      <div className="px-5 py-4 border-b border-border-subtle">
                        <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-2">Products</p>
                        <div className="flex flex-wrap gap-2">
                          {profiles.map((sys, i) => (
                            <span key={i} className="text-xs bg-brand-subtle text-brand-bright px-2.5 py-1 rounded-full font-medium">
                              {sys.product_code} — {sys.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Embed code */}
                      <div className="px-5 py-4 border-b border-border-subtle">
                        <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-2">Embed code</p>
                        <div className="bg-page rounded-lg px-3 py-2.5 font-mono text-xs text-text-faint break-all leading-relaxed mb-3 border border-border">
                          {code}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <CopyButton text={code} label="Copy embed code" />
                          <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors">
                            Preview widget ↗
                          </a>
                          <button onClick={() => openEdit(widget)}
                            className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors">
                            Edit products
                          </button>
                        </div>
                      </div>

                      {/* Installation instructions */}
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-1">Installation guide</p>
                        <p className="text-xs text-text-faint mb-3">
                          Step-by-step instructions for WordPress, Squarespace, Wix, Shopify, Webflow, Framer, GoDaddy, Weebly, and more.
                        </p>
                        <button
                          onClick={() => downloadInstructions(supplier.name, code, previewUrl)}
                          className="text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors">
                          Download instructions (HTML)
                        </button>
                      </div>

                    </div>
                  )
                })}
            </div>
          )}
        </section>

        {/* Browse manufacturers */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-1">Browse manufacturers</h2>
          <p className="text-text-faint text-sm mb-5">
            Add product widgets from other manufacturers to your portal. Contact BuildQuote to get set up.
          </p>

          {manufacturers.length === 0 ? (
            <p className="text-text-faint text-sm">Loading manufacturers...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {manufacturers.map(mf => {
                const hasWidget = coveredManufacturerIds.has(mf.id)
                return (
                  <div key={mf.id} className={`bg-surface border rounded-xl p-5 flex flex-col gap-3 ${hasWidget ? 'border-brand/40' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary text-sm leading-snug">{mf.name}</p>
                        {mf.description && (
                          <p className="text-text-faint text-xs mt-1 line-clamp-2">{mf.description}</p>
                        )}
                      </div>
                      {hasWidget && (
                        <span className="flex-shrink-0 text-xs bg-brand-subtle text-brand-bright px-2.5 py-1 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-text-faint text-xs">
                        {mf.systems.length} product{mf.systems.length !== 1 ? 's' : ''} available
                      </span>
                      {hasWidget ? (
                        <span className="text-xs text-text-faint">Widget installed</span>
                      ) : (
                        <a
                          href={`mailto:hello@buildquote.com.au?subject=Widget request: ${encodeURIComponent(mf.name)} — ${encodeURIComponent(supplier.name)}&body=Hi BuildQuote,%0A%0AI'd like to add a ${encodeURIComponent(mf.name)} product widget to my supplier portal.%0A%0ASupplier: ${encodeURIComponent(supplier.name)}%0A%0AThanks`}
                          className="text-xs px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors">
                          Request this widget →
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Enquiries */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-5">
            Product enquiries
            <span className="ml-2 text-sm font-normal text-text-faint">({enquiries.length})</span>
          </h2>

          {enquiries.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <p className="text-text-faint text-sm">No enquiries yet. They will appear here when visitors submit a request via your widget.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map(enq => (
                <div key={enq.id} className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{enq.name}</p>
                      <p className="text-text-faint text-xs mt-0.5">{enq.email}{enq.phone ? ` · ${enq.phone}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {enq.product_code && (
                        <span className="text-xs bg-brand-subtle text-brand-bright px-2.5 py-1 rounded-full font-medium">
                          {enq.product_code}
                        </span>
                      )}
                      <p className="text-text-faint text-xs mt-1">{formatDate(enq.created_at)}</p>
                    </div>
                  </div>
                  {enq.message && (
                    <p className="text-text-secondary text-sm leading-relaxed border-t border-border-subtle pt-3">{enq.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-text-faint text-xs pb-4">Powered by BuildQuote</p>
      </div>

      {/* Edit products modal */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditState(null) }}>
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-text-primary">Edit products</h3>
                <p className="text-xs text-text-faint mt-0.5">Toggle the products your business stocks</p>
              </div>
              <button onClick={() => setEditState(null)}
                className="text-text-faint hover:text-text-primary text-xl leading-none px-1">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {editSelectedIds.length > 0 && (
                <p className="text-brand text-sm font-medium">{editSelectedIds.length} selected</p>
              )}
              {['Decking', 'Cladding', 'Screening & Fencing'].map(cat => {
                const catSystems = editSystems.filter(s => s.category === cat)
                if (catSystems.length === 0) return null
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-2">{cat}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catSystems.map(sys => {
                        const isSelected = editSelectedIds.includes(sys.id)
                        return (
                          <button key={sys.id} type="button"
                            onClick={() => setEditSelectedIds(prev => prev.includes(sys.id) ? prev.filter(id => id !== sys.id) : [...prev, sys.id])}
                            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${isSelected ? 'bg-brand-subtle border-brand' : 'bg-ui border-border hover:border-brand/60'}`}>
                            <span className="font-mono text-xs text-text-faint block mb-0.5">{sys.product_code}</span>
                            <span className={`font-medium text-sm ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{sys.name}</span>
                            {sys.subcategory && <span className="text-text-faint text-xs block">{sys.subcategory}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {editError && <p className="text-error text-sm">{editError}</p>}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              <button onClick={() => setEditState(null)}
                className="text-sm text-text-faint hover:text-text-primary transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={editSaving || editSelectedIds.length === 0}
                className="px-6 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors">
                {editSaving ? 'Saving...' : `Save ${editSelectedIds.length} product${editSelectedIds.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
