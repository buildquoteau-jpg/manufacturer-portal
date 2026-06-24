import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicSupplierDetail } from '@/lib/data/getPublicSuppliers'
import type { SupplierDetailBrand } from '@/lib/data/getPublicSuppliers'
import { BrowseDropdown } from './BrowseDropdown'
import { BrandMarquee } from './BrandMarquee'

/* ─── SEO Metadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supplier = await getPublicSupplierDetail(slug)
  if (!supplier) return {}

  const location = [supplier.suburb, supplier.state].filter(Boolean).join(', ')
  const title = location
    ? `${supplier.name} — Building Materials Supplier in ${location} | BuildQuote`
    : `${supplier.name} — Building Materials Supplier | BuildQuote`

  const description =
    supplier.bio?.slice(0, 160) ??
    `${supplier.name} is a trusted building materials supplier${location ? ` based in ${location}` : ''}. Browse products, get quotes and request delivery via BuildQuote.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: supplier.hero_photo_url ? [supplier.hero_photo_url] : [],
    },
  }
}

/* ─── Sub-components ───────────────────────────────────────────── */

function BrandCard({ brand, supplierSlug }: { brand: SupplierDetailBrand; supplierSlug: string }) {
  return (
    <Link href={`/supplierdirectory/${supplierSlug}/${brand.slug}`} className="dir-brand-card">
      {brand.logo_url ? (
        <img src={brand.logo_url} alt={brand.name}
          style={{ height: '34px', objectFit: 'contain', marginBottom: '12px', alignSelf: 'flex-start' }} />
      ) : (
        <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#185D7A' }}>{brand.name}</p>
      )}
      {brand.logo_url && (
        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#111827' }}>{brand.name}</p>
      )}
      {brand.description && (
        <p className="dir-clamp" style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.6, flex: 1 }}>
          {brand.description}
        </p>
      )}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {brand.system_count} system{brand.system_count !== 1 ? 's' : ''}
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 700, color: '#ffffff',
          background: '#185D7A', padding: '5px 12px', borderRadius: '6px',
        }}>
          Browse →
        </span>
      </div>
    </Link>
  )
}

function HeroButton({
  href, label, icon,
}: {
  href: string; label: string; icon: string
}) {
  return (
    <a
      href={href}
      target={href.startsWith('tel') ? undefined : '_blank'}
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '10px 18px',
        fontSize: '13px', fontWeight: 700,
        color: '#ffffff',
        background: 'rgba(255,255,255,0.18)',
        border: '1.5px solid rgba(255,255,255,0.55)',
        borderRadius: '8px',
        textDecoration: 'none',
        backdropFilter: 'blur(4px)',
        transition: 'background 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </a>
  )
}

function InfoRow({ label, value, href, icon }: { label: string; value: string; href?: string; icon?: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '18px', width: '28px', flexShrink: 0, textAlign: 'center', paddingTop: '1px' }}>
        {icon ?? ''}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        {href ? (
          <a href={href} target={href.startsWith('tel') ? undefined : '_blank'} rel="noopener noreferrer"
            style={{ fontSize: '14px', color: '#185D7A', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {value}
          </a>
        ) : (
          <span style={{ fontSize: '14px', color: '#374151', wordBreak: 'break-word', lineHeight: 1.6, display: 'block' }}>
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── JSON-LD ──────────────────────────────────────────────────── */

function JsonLd({ supplier }: { supplier: NonNullable<Awaited<ReturnType<typeof getPublicSupplierDetail>>> }) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HardwareStore',
    name: supplier.name,
    description: supplier.bio ?? undefined,
    url: supplier.website_url ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://search.buildquote.com.au'}/supplierdirectory/${supplier.slug}`,
    telephone: supplier.phone ?? undefined,
    address: supplier.address ? {
      '@type': 'PostalAddress',
      streetAddress: supplier.address,
      addressLocality: supplier.suburb ?? undefined,
      addressRegion: supplier.state ?? undefined,
      addressCountry: 'AU',
    } : undefined,
    hasMap: supplier.google_maps_url ?? undefined,
    openingHours: supplier.opening_hours ?? undefined,
    areaServed: supplier.service_postcodes
      ? supplier.service_postcodes.split(/[,\s]+/).map(pc => ({
          '@type': 'GeoCircle',
          geoMidpoint: { '@type': 'GeoCoordinates' },
          description: `Postcode ${pc.trim()}`,
        }))
      : undefined,
    makesOffer: supplier.brands.map(b => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Product', brand: { '@type': 'Brand', name: b.name } },
    })),
  }

  // Remove undefined keys
  const clean = JSON.parse(JSON.stringify(ld))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clean) }}
    />
  )
}

/* ─── Page ─────────────────────────────────────────────────────── */

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supplier = await getPublicSupplierDetail(slug)
  if (!supplier) notFound()

  const heroY    = supplier.hero_photo_y    ?? 50
  const heroZoom = supplier.hero_photo_zoom ?? 100
  const heroSize = heroZoom > 100 ? `${heroZoom}%` : 'cover'
  const location = [supplier.suburb, supplier.state].filter(Boolean).join(', ')

  const hasContactInfo = !!(
    supplier.address || supplier.phone || supplier.website_url ||
    supplier.google_maps_url || supplier.service_postcodes ||
    supplier.delivery_info || supplier.opening_hours
  )

  // Display name for website button (strip https://)
  const websiteLabel = supplier.website_url
    ? supplier.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null

  return (
    <div>
      <JsonLd supplier={supplier} />

      <style>{`
        .dir-brand-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .dir-brand-card:hover {
          box-shadow: 0 6px 20px rgba(24,93,122,0.14);
          transform: translateY(-2px);
        }
        .dir-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dir-hero-btn:hover {
          background: rgba(255,255,255,0.32) !important;
        }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{
        height: '360px',
        background: supplier.hero_photo_url
          ? `url(${supplier.hero_photo_url}) center ${heroY}% / ${heroSize} no-repeat`
          : 'linear-gradient(135deg, #0f2d3d 0%, #185D7A 55%, #2596be 100%)',
        position: 'relative',
      }}>
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '28px 32px',
        }}>
          {/* Breadcrumb */}
          <Link href="/supplierdirectory" style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none', marginBottom: '10px',
            letterSpacing: '0.02em',
          }}>
            ← Supplier Directory
          </Link>

          <h1 style={{ margin: '0 0 4px', fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
            {supplier.name}
          </h1>
          {location && (
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
              📍 {location}
            </p>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {supplier.phone && (
              <HeroButton href={`tel:${supplier.phone}`} label={supplier.phone} icon="📞" />
            )}
            {supplier.website_url && (
              <HeroButton href={supplier.website_url} label="Visit Website" icon="🌐" />
            )}
            {supplier.google_maps_url && (
              <HeroButton href={supplier.google_maps_url} label="Get Directions" icon="🗺️" />
            )}
          </div>
        </div>
      </div>

      {/* ── Animated brand logo marquee ────────────────────────── */}
      {supplier.brands.length > 0 && (
        <BrandMarquee brands={supplier.brands} />
      )}

      {/* ── Main content ───────────────────────────────────────── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* About */}
          {supplier.bio && (
            <section style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '28px 32px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 800, color: '#0f2d3d' }}>
                About {supplier.name}
              </h2>
              <p style={{ margin: 0, fontSize: '15px', color: '#374151', lineHeight: 1.8 }}>
                {supplier.bio}
              </p>
            </section>
          )}

          {/* Product Catalogue */}
          {supplier.brands.length > 0 && (
            <section style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '28px 32px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#0f2d3d' }}>
                Product Catalogue
              </h2>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                {supplier.name} stocks products from {supplier.brands.length} manufacturer{supplier.brands.length !== 1 ? 's' : ''}.
                Select a brand below to explore available systems, specifications and request a quote.
              </p>

              {supplier.brands.length > 1 && (
                <BrowseDropdown brands={supplier.brands} supplierSlug={slug} />
              )}

              {supplier.brands.length === 1 && (
                <a
                  href={`/supplierdirectory/${slug}/${supplier.brands[0].slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#eef6fa', border: '1.5px solid #b8d9e8',
                    borderRadius: '12px', padding: '16px 20px',
                    textDecoration: 'none', marginBottom: '20px',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f2d3d' }}>
                    Browse {supplier.brands[0].name} Products
                  </span>
                  <span style={{
                    fontSize: '13px', fontWeight: 700, color: '#ffffff',
                    background: '#185D7A', padding: '8px 18px', borderRadius: '7px',
                  }}>
                    Browse →
                  </span>
                </a>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '14px',
              }}>
                {supplier.brands.map(b => (
                  <BrandCard key={b.id} brand={b} supplierSlug={slug} />
                ))}
              </div>
            </section>
          )}

          {/* Location & Contact */}
          {hasContactInfo && (
            <section style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '28px 32px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f2d3d' }}>
                Location & Contact
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
                Get in touch or visit {supplier.name} in {location || 'store'}.
              </p>
              {supplier.address         && <InfoRow icon="🏢" label="Address"      value={supplier.address} />}
              {supplier.phone           && <InfoRow icon="📞" label="Phone"         value={supplier.phone}         href={`tel:${supplier.phone}`} />}
              {supplier.website_url     && <InfoRow icon="🌐" label="Website"       value={websiteLabel ?? supplier.website_url} href={supplier.website_url} />}
              {supplier.google_maps_url && <InfoRow icon="🗺️" label="Directions"    value="Open in Google Maps"    href={supplier.google_maps_url} />}
              {supplier.opening_hours   && <InfoRow icon="🕐" label="Opening Hours" value={supplier.opening_hours} />}
              {supplier.service_postcodes && <InfoRow icon="📦" label="Service Area" value={supplier.service_postcodes} />}
              {supplier.delivery_info   && <InfoRow icon="🚚" label="Delivery"      value={supplier.delivery_info} />}
            </section>
          )}

          {/* SEO content block */}
          <section style={{
            background: 'linear-gradient(135deg, #f0f7fb 0%, #eaf4f9 100%)',
            border: '1px solid #d0e8f2',
            borderRadius: '16px',
            padding: '32px',
          }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800, color: '#0f2d3d' }}>
              Find Building Materials Suppliers Near You on BuildQuote
            </h2>
            <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#185D7A' }}>BuildQuote Supplier Directory</strong> connects homeowners and builders in Southwest Western Australia with trusted local building material suppliers. Whether you're looking for wall cladding, roofing, insulation, windows or structural systems — the BuildQuote directory helps you find a nearby supplier who stocks the brands you need.
              </p>
              <p style={{ margin: 0 }}>
                {supplier.name}{location ? ` in ${location}` : ''} is listed in the BuildQuote directory because they carry manufacturer-verified product ranges. Each brand card above links directly to that manufacturer's product catalogue, complete with system specifications, available sizes and technical details — so you can shortlist what you need before you pick up the phone.
              </p>
              <p style={{ margin: 0 }}>
                <strong>How it works:</strong> Browse the product catalogue above, select the systems you need, then use <a href="https://buildquote.com.au" style={{ color: '#185D7A' }}>BuildQuote.com.au</a> to generate a professional Request for Quotation (RFQ) email directly to {supplier.name}. No spreadsheets, no handwriting — just a clean, itemised quote request in seconds.
              </p>
              <p style={{ margin: 0 }}>
                BuildQuote is built for the Southwest WA building industry. Our supplier directory covers the Bunbury, Busselton, Margaret River, Dunsborough, Harvey, Collie, Manjimup, Bridgetown and surrounding regions. If you're a builder, owner-builder or trade professional working in the South West, add BuildQuote to your workflow and save hours every week on quoting.
              </p>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="https://buildquote.com.au" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', fontSize: '13px', fontWeight: 700,
                color: '#ffffff', background: '#185D7A', borderRadius: '8px',
                textDecoration: 'none', boxShadow: '0 2px 8px rgba(24,93,122,0.22)',
              }}>
                Send an RFQ on BuildQuote →
              </a>
              <Link href="/supplierdirectory" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', fontSize: '13px', fontWeight: 700,
                color: '#185D7A', background: '#ffffff', border: '1.5px solid #b8d9e8',
                borderRadius: '8px', textDecoration: 'none',
              }}>
                ← Back to Directory
              </Link>
            </div>
          </section>

        </div>

        <p style={{ marginTop: '48px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          Powered by <a href="https://buildquote.com.au" style={{ color: '#185D7A', textDecoration: 'none' }}>BuildQuote</a>
        </p>
      </div>
    </div>
  )
}
