import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getManufacturerData } from '@/lib/data/getManufacturerData'
import { ManufacturerHero } from '@/app/widget/[token]/ManufacturerHero'
import { WidgetClient } from '@/app/widget/[token]/WidgetClient'

export const dynamic = 'force-dynamic'

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getManufacturerData(slug)
  if (!data) return {}

  const { manufacturer, systems } = data

  const primaryCategory = systems[0]?.category ?? null
  const autoTitle = primaryCategory
    ? `${manufacturer.name} | ${primaryCategory} | BuildQuote South West Product Directory`
    : `${manufacturer.name} | BuildQuote South West Product Directory`

  const title = manufacturer.seo_title || autoTitle
  const description =
    manufacturer.seo_description ||
    manufacturer.description ||
    `Explore products, systems and supplier information for ${manufacturer.name} in the BuildQuote South West Product Directory.`

  const heroImage = manufacturer.hero_wide_image_url || manufacturer.hero_image_url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://mfp.buildquote.com.au/manufacturers/${slug}`,
      siteName: 'BuildQuote',
      locale: 'en_AU',
      type: 'website',
      ...(heroImage && {
        images: [{ url: heroImage, alt: `${manufacturer.name} products` }],
      }),
    },
  }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function ManufacturerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ draft?: string }>
}) {
  const { slug } = await params
  const { draft } = await searchParams

  const data = await getManufacturerData(slug)
  if (!data) notFound()

  const { manufacturer, systems } = data

  const buildquoteBase = process.env.NEXT_PUBLIC_BUILDQUOTE_URL || 'http://localhost:3000'
  const returnHref = draft ? `${buildquoteBase}/rfq?draft=${draft}` : undefined

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: manufacturer.name,
    url:
      manufacturer.website_url ||
      `https://mfp.buildquote.com.au/manufacturers/${slug}`,
    description:
      manufacturer.description ||
      `Building products and systems by ${manufacturer.name}, available through the BuildQuote South West Product Directory.`,
    ...(manufacturer.logo_url && { logo: manufacturer.logo_url }),
    ...(manufacturer.hero_wide_image_url || manufacturer.hero_image_url
      ? { image: manufacturer.hero_wide_image_url || manufacturer.hero_image_url }
      : {}),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'South West Western Australia',
    },
  }

  // ── SEO content block ────────────────────────────────────────────────────
  const categories = [...new Set(systems.map(s => s.category).filter(Boolean))]
  const systemNames = systems.slice(0, 4).map(s => s.name)

  const categoryText =
    categories.length > 0
      ? categories.join(', ').toLowerCase()
      : 'building products'

  const seoIntro =
    manufacturer.description ||
    `${manufacturer.name} supplies ${categoryText} systems for residential and commercial construction.`

  const systemText =
    systemNames.length > 0
      ? `The range includes ${systemNames.join(', ')} and more.`
      : ''

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back nav */}
      <div style={{
        background: '#f5f7f9', borderBottom: '1px solid #e5e7eb',
        padding: '12px 20px', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <a
          href={`/manufacturers${draft ? `?draft=${draft}` : ''}`}
          style={{
            fontSize: '14px', fontWeight: 600, color: '#185D7A',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 12L4 7L9 2" stroke="#185D7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All Manufacturers
        </a>
        {draft && (
          <>
            <span style={{ color: '#d1d5db' }}>·</span>
            <a
              href={returnHref}
              style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', textDecoration: 'none' }}
            >
              Return to RFQ →
            </a>
          </>
        )}
      </div>

      {/* Manufacturer hero */}
      <ManufacturerHero manufacturer={manufacturer} />

      {/* Mode banner */}
      {draft && (
        <div style={{
          background: '#eef6fa', borderBottom: '1px solid #b8d9e8',
          padding: '12px 20px', textAlign: 'center',
          fontSize: '14px', fontWeight: 600, color: '#185D7A',
        }}>
          Select profiles or components on each product card, then tap "Add to quote"
        </div>
      )}

      {/* System cards */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 100px' }}>
        {systems.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '15px', textAlign: 'center', padding: '40px 0' }}>
            No products listed for this manufacturer yet.
          </p>
        ) : (
          <WidgetClient
            systems={systems}
            widgetId=""
            supplierName={undefined}
            mode='rfq'
            draftId={draft}
            returnHref={returnHref}
            manufacturerName={manufacturer.name}
          />
        )}

        {/* SEO content block */}
        <div style={{
          marginTop: '64px',
          padding: '32px',
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
            {manufacturer.name} — Manufacturer Overview
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#475569', marginBottom: '12px' }}>
            {seoIntro}{systemText ? ` ${systemText}` : ''}
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#475569' }}>
            The <a href="https://buildquote.com.au/south-west-building-materials-directory" style={{ color: '#185D7A', fontWeight: 600 }}>
              BuildQuote South West Product Directory
            </a> connects builders, renovators and owner-builders with building material suppliers
            and manufacturers across Busselton, Dunsborough, Margaret River, Bunbury and the wider South West of Western Australia.
            Browse product systems, compare specifications and request quotes — all in one place.
          </p>
        </div>
      </div>
    </>
  )
}
