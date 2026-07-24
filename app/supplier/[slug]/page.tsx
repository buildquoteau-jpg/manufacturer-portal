'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SupplierData, RfqEnquiry, Manufacturer } from './shared'
import { ProfileTab } from './ProfileTab'
import { ProductsTab } from './ProductsTab'
import { MyProductsTab } from './MyProductsTab'
import { EnquiriesTab } from './EnquiriesTab'
import { AccountTab } from './AccountTab'
import { TradeDeskTab, CrossSellRule } from './TradeDeskTab'

// NEXT_PUBLIC_ required — this is a client component. The value is the admin's
// email address used to bypass per-supplier auth. Low risk (email ≠ secret),
// but move to a server action before go-live if you want it out of the bundle.
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

type Tab = 'profile' | 'my-products' | 'trade-desk' | 'products' | 'enquiries' | 'account'

// ── First login modal ─────────────────────────────────────────────────────────

function FirstLoginModal({ supplierEmail, accessToken, supplierSlug, onDone }: {
  supplierEmail: string | null; accessToken: string; supplierSlug: string; onDone: () => void
}) {
  const [pw, setPw]             = useState('')
  const [confirm, setConfirm]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCfm, setShowCfm]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 8)  return setError('Password must be at least 8 characters')
    if (pw !== confirm) return setError('Passwords do not match')
    setSaving(true); setError('')

    const { error: authErr } = await supabase.auth.updateUser({ password: pw })
    if (authErr) { setError(authErr.message); setSaving(false); return }

    await fetch('/api/supplier/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ supplierSlug, first_login: false }),
    })

    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-2xl font-bold tracking-widest text-text-faint uppercase">
            BUILD<span className="text-brand">QUOTE</span>
          </span>
          <h2 className="text-text-primary font-bold mt-4">Welcome to your portal</h2>
          <p className="text-text-faint text-sm mt-2">
            Please set your own password to continue.
            {supplierEmail && <> Your login email is <strong className="text-text-secondary">{supplierEmail}</strong>.</>}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">New password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={pw}
                onChange={e => { setPw(e.target.value); setError('') }}
                placeholder="At least 8 characters" autoFocus required
                className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 pr-10 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
              <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm password</label>
            <div className="relative">
              <input type={showCfm ? 'text' : 'password'} value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                placeholder="Repeat your new password" required
                className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 pr-10 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
              <button type="button" tabIndex={-1} onClick={() => setShowCfm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors"
                aria-label={showCfm ? 'Hide password' : 'Show password'}>
                {showCfm ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-error text-xs">{error}</p>}
          <button type="submit" disabled={saving || !pw || !confirm}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
            {saving ? 'Setting password…' : 'Set password & continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SupplierPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [supplier, setSupplier]         = useState<SupplierData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [isAdmin, setIsAdmin]           = useState(false)
  const [accessToken, setAccessToken]   = useState('')
  const [origin, setOrigin]             = useState('')
  const [showFirstLogin, setShowFirstLogin] = useState(false)
  const [activeTab, setActiveTab]       = useState<Tab>('profile')

  const [enquiries, setEnquiries]       = useState<RfqEnquiry[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [crossSellRules, setCrossSellRules] = useState<CrossSellRule[]>([])

  useEffect(() => {
    setOrigin(window.location.origin)
    loadSupplier()

    // If user logged in without "Remember me", sign them out when the tab/browser closes.
    if (sessionStorage.getItem('mfp-session-only') === '1') {
      const handleUnload = () => { supabase.auth.signOut() }
      window.addEventListener('pagehide', handleUnload)
      return () => window.removeEventListener('pagehide', handleUnload)
    }
  }, [])

  async function loadSupplier() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/supplier/login'; return }
    setAccessToken(session.access_token)

    const adminUser = ADMIN_EMAIL && session.user.email === ADMIN_EMAIL
    setIsAdmin(!!adminUser)

    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        id, name, slug, address, suburb, state, website_url, email, phone,
        manager_name, bio, hero_photo_url, hero_photo_y, hero_photo_zoom, google_maps_url,
        service_postcodes, delivery_info, first_login,
        auth_user_id, created_at,
        embed_widgets (
          id, name, public_token, status, created_at,
          embed_widget_systems ( system_id, systems ( name, product_code, manufacturer_id ) )
        )
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) { setNotFound(true); setLoading(false); return }

    const s = data as unknown as SupplierData

    if (!adminUser && s.auth_user_id && s.auth_user_id !== session.user.id) {
      setUnauthorized(true); setLoading(false); return
    }

    setSupplier(s)
    if (s.first_login && !adminUser) setShowFirstLogin(true)
    loadEnquiries(s)
    loadManufacturers()
    loadCrossSellRules()
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

  async function loadManufacturers() {
    // Full System Card shape (matches lib/data/getWidgetData.ts's query) so
    // Trade Desk can render the same master System Card as the widget/library
    // — see components/system-card/.
    const { data } = await supabase
      .from('manufacturers')
      .select(`
        id, name, slug, description, logo_url, website_url,
        hero_image_url, hero_image_position_y,
        systems (
          id, name, product_code, slug, category, subcategory, sort_order,
          description, hero_image_url, hero_image_position_x, hero_image_position_y,
          website_url, install_guide_urls, design_guide_url, tech_data_url,
          notes, fire_rating, acoustic_rating, moisture_resistant,
          structural_grade, bal_rating, australian_made,
          system_colours ( colour_name, image_url, sort_order, is_stocked ),
          system_components (
            id, role, notes, sort_order,
            components ( name, sku, description, category, uom, procurement_route )
          ),
          system_profiles (
            id, profile_name, name, product_code, dimensions,
            length_mm, width_mm, height_mm, thickness_mm, uom,
            supplier_pack_qty, supplier_pack_uom, sort_order
          )
        )
      `)
      .order('name')
    if (data) setManufacturers(data as unknown as Manufacturer[])
  }

  async function loadCrossSellRules() {
    // Table only exists once 20260723_cross_sell_and_channel.sql has been run
    // — `data` stays null and the Trade Desk cross-sell strip simply renders
    // nothing until then.
    const { data } = await supabase
      .from('category_cross_sell_rules')
      .select('from_category, to_category')
    if (data) setCrossSellRules(data as CrossSellRule[])
  }

  // ── Loading / error states ────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <p className="text-text-faint text-sm">Loading…</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center space-y-2">
        <p className="text-text-faint text-sm">Supplier portal not found.</p>
        <p className="text-text-faint text-xs">Check the URL or contact BuildQuote.</p>
      </div>
    </div>
  )

  if (unauthorized) return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-text-faint text-sm">You don't have access to this portal.</p>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/supplier/login' }}
          className="text-brand text-xs hover:underline block mx-auto">
          Sign out and try another account
        </button>
      </div>
    </div>
  )

  if (!supplier) return null

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'profile',      label: 'Profile' },
    { id: 'my-products',  label: 'My Products' },
    { id: 'trade-desk',   label: 'Trade Desk' },
    { id: 'products',     label: 'Website Widgets', count: supplier.embed_widgets.length },
    { id: 'enquiries',    label: 'Enquiries',        count: enquiries.length },
    { id: 'account',      label: 'Account' },
  ]

  return (
    <div className="min-h-screen bg-page">

      {showFirstLogin && (
        <FirstLoginModal
          supplierEmail={supplier.email}
          accessToken={accessToken}
          supplierSlug={slug}
          onDone={() => { setShowFirstLogin(false); loadSupplier() }}
        />
      )}

      {/* Nav + tab bar */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border">
        <div className="max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-6">

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-widest text-text-faint uppercase">
                BUILD<span className="text-brand">QUOTE</span>
              </span>
              <span className="text-text-faint text-sm">/</span>
              <span className="text-text-primary font-semibold text-sm">{supplier.name}</span>
              {isAdmin && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded font-medium">Admin view</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-xs text-text-faint hover:text-text-primary transition-colors">← Portal home</a>
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/supplier/login' }}
                className="text-xs text-text-faint hover:text-text-primary transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'text-brand border-brand'
                    : 'text-text-faint border-transparent hover:text-text-secondary'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    activeTab === tab.id ? 'bg-brand/15 text-brand' : 'bg-ui text-text-faint'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Tab content */}
      <div className={`mx-auto px-6 py-8 ${activeTab === 'products' || activeTab === 'my-products' || activeTab === 'trade-desk' ? 'max-w-6xl xl:max-w-7xl 2xl:max-w-[1480px]' : 'max-w-3xl xl:max-w-5xl 2xl:max-w-6xl'}`}>
        {activeTab === 'profile' && (
          <ProfileTab supplier={supplier} accessToken={accessToken} slug={slug} onReload={loadSupplier} />
        )}
        {activeTab === 'my-products' && (
          <MyProductsTab
            supplier={supplier}
            manufacturers={manufacturers}
            accessToken={accessToken}
            slug={slug}
            onReload={loadSupplier}
          />
        )}
        {activeTab === 'products' && (
          <ProductsTab
            supplier={supplier}
            manufacturers={manufacturers}
            accessToken={accessToken}
            slug={slug}
            origin={origin}
            onReload={loadSupplier}
          />
        )}
        {activeTab === 'trade-desk' && (
          <TradeDeskTab
            supplier={supplier}
            manufacturers={manufacturers}
            accessToken={accessToken}
            slug={slug}
            origin={origin}
            crossSellRules={crossSellRules}
          />
        )}
        {activeTab === 'enquiries' && (
          <EnquiriesTab enquiries={enquiries} />
        )}
        {activeTab === 'account' && (
          <AccountTab supplier={supplier} slug={slug} />
        )}
        <p className="text-center text-text-faint text-xs pt-8">Powered by BuildQuote</p>
      </div>

    </div>
  )
}
