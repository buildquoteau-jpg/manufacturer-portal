'use client'

import { useState } from 'react'
import { WidgetClient } from '@/app/widget/[token]/WidgetClient'
import type { WidgetData } from '@/lib/data/getWidgetData'
import type { PublicSupplierDetail, SupplierDetailBrand } from '@/lib/data/getPublicSuppliers'

type ShowroomWidget = { brand: SupplierDetailBrand; widget: WidgetData }

// ── Per-brand category copy ────────────────────────────────────────────────────
// Keyed by manufacturer slug — fallback to generic if no match.

const BRAND_META: Record<string, {
  navLabel: string
  pageTitle: string
  tagline: string
  intro: string
  featuredIntro: string
  deliveryNote: string
  emoji: string
}> = {
  'bq-fibreline-building-products': {
    navLabel: 'Fibre Cement',
    pageTitle: 'Fibre Cement Cladding & Linings',
    tagline: 'Durable, low-maintenance fibre cement systems for residential & commercial builds.',
    intro: 'Our fibre cement range covers weatherboard planks, flat sheet panels, VGroove feature boards and soffit linings. All BQ FibreLine products are pre-primed and ready for site painting — Australian made and tested against our harsh coastal conditions. Suitable for BAL-rated areas.',
    featuredIntro: 'Popular systems in this range',
    deliveryNote: 'Fibre cement sheets are delivered on flat-bed. Minimum order 1 pack. Lead time 2–5 business days for Dunsborough & surrounds.',
    emoji: '🏠',
  },
  'bq-timberlock-pergola-systems': {
    navLabel: 'Pergolas & Outdoor',
    pageTitle: 'Pergola & Outdoor Timber Systems',
    tagline: 'Engineered timber pergola systems built for Southwest WA conditions.',
    intro: 'BQ TimberLock pergola systems use hardwood glulam members and stainless fixings designed for coastal exposure. Each system comes with pre-cut members, connection hardware and a full cut list. Our yard team can arrange delivery and crane lift if required.',
    featuredIntro: 'Popular pergola systems',
    deliveryNote: 'Pergola systems are bundled and delivered via crane truck. Contact us for delivery quotes beyond 30km from Dunsborough.',
    emoji: '🌿',
  },
  'bq-aquashield-waterproofing': {
    navLabel: 'Waterproofing',
    pageTitle: 'Waterproofing & Wet Area Membranes',
    tagline: 'Wet area and external waterproofing systems for compliant residential builds.',
    intro: 'BQ AquaShield waterproofing covers wet area membranes for bathrooms and laundries, as well as external below-slab and balcony systems. All products carry CodeMark or equivalent compliance documentation. We stock sheet membrane, liquid-applied systems and primer kits.',
    featuredIntro: 'Commonly stocked systems',
    deliveryNote: 'Waterproofing products ship same-day from our Dunsborough warehouse for orders placed before 12pm. Minimum order quantities apply on sheet membrane.',
    emoji: '💧',
  },
  'bq-inform-building-products': {
    navLabel: 'Insulation',
    pageTitle: 'Insulation & Building Wraps',
    tagline: 'Thermal and acoustic insulation for residential and light commercial.',
    intro: 'BQ InForm insulation and building wrap products are stocked across all common R-values and widths. Our team can help specify the right product for your wall, ceiling or underfloor application based on NCC compliance requirements for your climate zone.',
    featuredIntro: 'Common R-value options',
    deliveryNote: 'Insulation is delivered in compressed packs. We can split pallets for smaller jobs — ask our counter staff.',
    emoji: '🧱',
  },
  'james-hardie': {
    navLabel: 'James Hardie',
    pageTitle: 'James Hardie Fibre Cement Products',
    tagline: 'Australia\'s most trusted fibre cement brand — stocked at our Dunsborough yard.',
    intro: 'We stock the full James Hardie residential range including HardiFlex sheets, Hardieplank weatherboards, HardiGroove VJ panels and Harditrim mouldings. All products are available in standard builder pack quantities with short-notice availability for local contractors.',
    featuredIntro: 'Popular James Hardie lines',
    deliveryNote: 'James Hardie products are restocked weekly. Call ahead to confirm sheet availability for large orders. Delivery within 50km of Dunsborough.',
    emoji: '🏗️',
  },
  'compform-building-products': {
    navLabel: 'Composite Cladding',
    pageTitle: 'Composite & Aluminium Cladding',
    tagline: 'Premium composite and aluminium cladding for contemporary residential and commercial projects.',
    intro: 'Compform composite systems offer the look of timber cladding with the durability of aluminium. Zero maintenance, BAL-compliant options available, and a wide colour palette. Ideal for new builds and reclads on coastal or bushfire-prone sites.',
    featuredIntro: 'Featured composite systems',
    deliveryNote: 'Composite cladding is cut-to-length in our Dunsborough yard. Allow 3–5 days for cutting and delivery. Volume discounts available for full-house reclads.',
    emoji: '✨',
  },
  'build-stage-systems': {
    navLabel: 'Framing',
    pageTitle: 'Structural Framing Systems',
    tagline: 'Engineered wall, floor and roof framing systems for residential construction.',
    intro: 'Build Stage structural systems cover timber and light gauge steel wall frames, floor cassettes and roof trusses. All components are engineered to span tables and supplied with fixing schedules. Our team can liaise with your structural engineer for project-specific requirements.',
    featuredIntro: 'Available framing systems',
    deliveryNote: 'Framing systems are fabricated to order. Lead time is typically 10–15 business days. Crane unload available on request.',
    emoji: '📐',
  },
}

function getBrandMeta(slug: string) {
  return BRAND_META[slug] ?? {
    navLabel: 'Products',
    pageTitle: 'Building Products',
    tagline: 'Quality building products for Southwest WA.',
    intro: 'Browse our full range of products below. Select the systems you need and submit a quote request — we\'ll get back to you with pricing and lead times.',
    featuredIntro: 'Available products',
    deliveryNote: 'Delivery available to most Southwest WA postcodes. Contact our yard for lead times.',
    emoji: '🏗️',
  }
}

// ── Supplier Nav ───────────────────────────────────────────────────────────────

function SupplierNav({
  supplier, widgets, activeBrand, onNavigate,
}: {
  supplier: PublicSupplierDetail
  widgets: ShowroomWidget[]
  activeBrand: string | null
  onNavigate: (slug: string | null) => void
}) {
  return (
    <>
      {/* Back to portal */}
      <div style={{ background: '#111', padding: '8px 24px' }}>
        <a href="/supplier" style={{
          color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500,
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
          letterSpacing: '0.02em',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to BuildQuote Supplier Portal
        </a>
      </div>

      {/* Top bar: phone + hours */}
      <div style={{
        background: '#1a2e1a',
        padding: '6px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '12px', color: 'rgba(255,255,255,0.65)',
      }}>
        <span>📍 {[supplier.suburb, supplier.state].filter(Boolean).join(', ') || 'Southwest WA'}</span>
        <span>
          {supplier.phone ? `📞 ${supplier.phone}` : '📞 (08) 9755 1234'}
          {'  ·  '}
          {supplier.opening_hours ?? 'Mon–Fri 7am–5pm  ·  Sat 7:30am–12pm'}
        </span>
      </div>

      {/* Main nav */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: '0',
      }}>
        {/* Logo */}
        <button
          onClick={() => onNavigate(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '14px 0', marginRight: '32px', display: 'flex', flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {supplier.name}
          </span>
          <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500, letterSpacing: '0.04em', marginTop: '1px' }}>
            BUILDING MATERIALS
          </span>
        </button>

        {/* Product category nav tabs */}
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto', gap: '0' }}>
          <button
            onClick={() => onNavigate(null)}
            style={{
              padding: '16px 14px',
              fontSize: '13px', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `3px solid ${activeBrand === null ? '#1a2e1a' : 'transparent'}`,
              color: activeBrand === null ? '#1a2e1a' : '#6b7280',
              whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            All Products
          </button>
          {widgets.map(w => {
            const meta = getBrandMeta(w.brand.slug)
            const isActive = activeBrand === w.brand.slug
            return (
              <button
                key={w.brand.slug}
                onClick={() => onNavigate(w.brand.slug)}
                style={{
                  padding: '16px 14px',
                  fontSize: '13px', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: `3px solid ${isActive ? '#1a7a3a' : 'transparent'}`,
                  color: isActive ? '#1a7a3a' : '#6b7280',
                  whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {meta.navLabel}
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, marginLeft: '16px' }}>
          <a href={supplier.phone ? `tel:${supplier.phone}` : 'tel:0897551234'}
            style={{
              padding: '9px 16px', fontSize: '13px', fontWeight: 600,
              color: '#1a2e1a', border: '1.5px solid #d1d5db', borderRadius: '8px',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
            Call Yard
          </a>
          <a href="https://buildquote.com.au/rfq" target="_blank" rel="noopener noreferrer"
            style={{
              padding: '9px 18px', fontSize: '13px', fontWeight: 700,
              color: '#ffffff', background: '#1a7a3a', borderRadius: '8px',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
            Get a Quote →
          </a>
        </div>
      </nav>
    </>
  )
}

// ── Home page ─────────────────────────────────────────────────────────────────

function HomePage({
  supplier, widgets, onSelectBrand,
}: {
  supplier: PublicSupplierDetail
  widgets: ShowroomWidget[]
  onSelectBrand: (slug: string) => void
}) {
  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2e1a 0%, #2d5a30 60%, #1a7a3a 100%)',
        padding: '64px 32px',
        textAlign: 'center',
      }}>
        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Southwest WA · Trusted since 2008
        </p>
        <h1 style={{ margin: '0 0 16px', fontSize: '38px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
          Your complete<br />building supply partner
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: '16px', color: 'rgba(255,255,255,0.75)', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
          This demo supplier website shows how stocked product ranges are displayed on a supplier&apos;s own website. The easy-to-install widget allows customers to select materials, and enquire about products straight from the supplier&apos;s own website.
        </p>
      </div>

      {/* How it works strip */}
      <div style={{
        background: '#f0faf2', borderBottom: '1px solid #d1e8d4',
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0',
      }}>
        {([
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a7a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            ),
            step: 'Browse', desc: 'Find the product range you need',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a7a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            ),
            step: 'Select', desc: 'Pick specifications and quantities',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a7a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.71 3.41 2 2 0 0 1 3.68 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 15.92z"/>
              </svg>
            ),
            step: 'Request', desc: 'Submit a quote directly to our yard',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a7a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            ),
            step: 'Deliver', desc: "We'll confirm pricing and book delivery",
          },
        ] as { icon: React.ReactNode; step: string; desc: string }[]).map((s, i) => (
          <div key={i} style={{
            padding: '16px 24px', textAlign: 'center', minWidth: '160px',
            borderRight: i < 3 ? '1px solid #d1e8d4' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a2e1a' }}>{s.step}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4, marginTop: '2px' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Product category grid */}
      <div id="products" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: '#1a2e1a' }}>
          Our Product Ranges
        </h2>
        <p style={{ margin: '0 0 32px', fontSize: '15px', color: '#6b7280' }}>
          Click any range to browse products and request a quote online.
        </p>
        <>
          <style>{`
            .showroom-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
            @media (min-width: 640px) { .showroom-grid { grid-template-columns: repeat(3, 1fr); } }
            @media (min-width: 900px) { .showroom-grid { grid-template-columns: repeat(4, 1fr); } }
            .showroom-card { background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 14px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: box-shadow 0.15s, border-color 0.15s; text-align: left; }
            .showroom-card:hover { box-shadow: 0 6px 24px rgba(26,46,26,0.13); border-color: #1a7a3a; }
          `}</style>
          <div className="showroom-grid">
            {widgets.map(w => (
              <button
                key={w.brand.slug}
                onClick={() => onSelectBrand(w.brand.slug)}
                className="showroom-card"
              >
                <div style={{
                  height: '110px', flexShrink: 0,
                  background: w.brand.hero_image_url
                    ? `url(${w.brand.hero_image_url}) center/cover`
                    : '#f0f4f8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!w.brand.hero_image_url && (
                    w.brand.logo_url
                      ? <img src={w.brand.logo_url} alt={w.brand.name} style={{ maxWidth: '75%', maxHeight: '65%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textAlign: 'center', padding: '0 12px' }}>{w.brand.name}</span>
                  )}
                </div>
                <div style={{ padding: '12px 14px 14px', flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: '4px' }}>{w.brand.name}</div>
                  {w.brand.description && (
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {w.brand.description}
                    </div>
                  )}
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#1a7a3a' }}>
                    {w.widget.systems.length} product{w.widget.systems.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      </div>
    </div>
  )
}

// ── Brand / Product page ───────────────────────────────────────────────────────

function BrandPage({
  widget, brand, supplier, onBack,
}: {
  widget: WidgetData
  brand: SupplierDetailBrand
  supplier: PublicSupplierDetail
  onBack: () => void
}) {
  const meta = getBrandMeta(brand.slug)
  const featuredSystems = widget.systems.slice(0, 3)

  return (
    <div style={{ background: '#f5f6f7' }}>

      {/* Page header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {/* Breadcrumb */}
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '13px', color: '#6b7280', fontWeight: 500, padding: 0,
        }}>
          All Products
        </button>
        <span style={{ color: '#d1d5db' }}>›</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a2e1a' }}>{meta.navLabel}</span>
      </div>

      {/* Category hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2e1a 0%, #2d5a30 100%)',
        padding: '48px 32px 40px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            {brand.logo_url && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', flexShrink: 0,
              }}>
                <img src={brand.logo_url} alt={brand.name}
                  style={{ height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                {meta.emoji}  {meta.navLabel}
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 }}>
                {meta.pageTitle}
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: '600px' }}>
                {meta.intro}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Featured systems — static snippet using first 3 real systems */}
        {featuredSystems.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1a2e1a' }}>
                {meta.featuredIntro}
              </h2>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                Scroll down to browse the full range ↓
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px',
            }}>
              {featuredSystems.map(sys => (
                <div key={sys.id} style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  {/* Product image placeholder */}
                  {sys.hero_image_url ? (
                    <img src={sys.hero_image_url} alt={sys.name}
                      style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{
                      height: '120px',
                      background: 'linear-gradient(135deg, #e8f5ea 0%, #d4ecd6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '32px',
                    }}>
                      {meta.emoji}
                    </div>
                  )}
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {sys.product_code ?? sys.category}
                    </p>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#1a2e1a' }}>
                      {sys.name}
                    </p>
                    {sys.description && (
                      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {sys.description}
                      </p>
                    )}
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: '#1a7a3a',
                      cursor: 'default',
                    }}>
                      Request quote below ↓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── The widget — rendered inline, native to the page ── */}
        <section style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: '32px',
        }}>
          {/* Section header */}
          <div style={{
            padding: '20px 24px 18px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#1a2e1a' }}>
                Browse full range & request a quote
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                Select the specifications you need. We'll confirm pricing, availability and lead times — usually within the same business day.
              </p>
            </div>
            <div style={{
              flexShrink: 0,
              background: '#f0faf2',
              border: '1px solid #d1e8d4',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px', fontWeight: 600, color: '#1a7a3a',
              whiteSpace: 'nowrap',
            }}>
              ✓ No account needed
            </div>
          </div>

          {/* Widget rendered inline — no iframe */}
          <div style={{ padding: '0 24px 24px' }}>
            <WidgetClient
              systems={widget.systems}
              widgetId={widget.id}
              supplierName={supplier.name}
              manufacturerName={widget.manufacturer?.name}
            />
          </div>
        </section>

        {/* Delivery info */}
        <section style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '14px',
          padding: '24px 28px',
          marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#1a2e1a' }}>
            🚚 Delivery & Ordering
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>
            {meta.deliveryNote}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {supplier.service_postcodes && (
              <span style={{
                fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
                background: '#f0faf2', color: '#1a7a3a', fontWeight: 600,
              }}>
                📦 Delivers to: {supplier.service_postcodes}
              </span>
            )}
            {supplier.delivery_info && (
              <span style={{
                fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
                background: '#f9fafb', color: '#6b7280', fontWeight: 500,
              }}>
                {supplier.delivery_info}
              </span>
            )}
          </div>
        </section>

        {/* Contact */}
        <section style={{
          background: 'linear-gradient(135deg, #f0faf2 0%, #eaf5eb 100%)',
          border: '1px solid #d1e8d4',
          borderRadius: '14px',
          padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#1a2e1a' }}>
              Need help or a trade account?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              Our yard team can help specify the right product for your job.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`} style={{
                padding: '10px 18px', fontSize: '13px', fontWeight: 700,
                color: '#1a2e1a', background: '#ffffff', border: '1.5px solid #1a2e1a',
                borderRadius: '8px', textDecoration: 'none',
              }}>
                📞 {supplier.phone}
              </a>
            )}
            {supplier.website_url && (
              <a href={supplier.website_url} target="_blank" rel="noopener noreferrer" style={{
                padding: '10px 18px', fontSize: '13px', fontWeight: 700,
                color: '#ffffff', background: '#1a7a3a',
                borderRadius: '8px', textDecoration: 'none',
              }}>
                Visit Website →
              </a>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

// ── Root client component ──────────────────────────────────────────────────────

export function ShowroomClient({
  widgets, supplier,
}: {
  widgets: ShowroomWidget[]
  supplier: PublicSupplierDetail
}) {
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const activeWidget = widgets.find(w => w.brand.slug === activeBrand)

  return (
    <div>
      <SupplierNav
        supplier={supplier}
        widgets={widgets}
        activeBrand={activeBrand}
        onNavigate={setActiveBrand}
      />

      {activeBrand && activeWidget ? (
        <BrandPage
          widget={activeWidget.widget}
          brand={activeWidget.brand}
          supplier={supplier}
          onBack={() => setActiveBrand(null)}
        />
      ) : (
        <HomePage
          supplier={supplier}
          widgets={widgets}
          onSelectBrand={setActiveBrand}
        />
      )}

      {/* Footer */}
      <div style={{
        background: '#1a2e1a', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} {supplier.name}
          {supplier.address ? ` · ${supplier.address}` : ''}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          Online quoting powered by{' '}
          <a href="https://buildquote.com.au" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            BuildQuote
          </a>
        </p>
      </div>
    </div>
  )
}
