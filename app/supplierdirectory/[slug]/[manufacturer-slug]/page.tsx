import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupplierBrandWidget } from '@/lib/data/getSupplierBrandWidget'
import { ManufacturerHero } from '@/app/widget/[token]/ManufacturerHero'
import { WidgetClient } from '@/app/widget/[token]/WidgetClient'

export default async function SupplierBrandPage({
  params,
}: {
  params: Promise<{ slug: string; 'manufacturer-slug': string }>
}) {
  const { slug, 'manufacturer-slug': manufacturerSlug } = await params
  const widget = await getSupplierBrandWidget(slug, manufacturerSlug)
  if (!widget) notFound()

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px 80px' }}>

      {/* Back nav */}
      <Link href={`/supplierdirectory/${slug}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '13px', fontWeight: 600, color: '#185D7A',
        textDecoration: 'none', marginBottom: '24px',
      }}>
        ← Back to {widget.supplier?.name ?? 'Supplier'}
      </Link>

      {/* Manufacturer hero */}
      <ManufacturerHero
        manufacturer={widget.manufacturer}
        supplierName={widget.supplier?.name}
      />

      {/* System count */}
      <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#9ca3af' }}>
        {widget.systems.length === 1
          ? '1 system available'
          : `${widget.systems.length} systems available`}
      </p>

      {/* System cards */}
      <WidgetClient
        systems={widget.systems}
        widgetId={widget.id}
        supplierName={widget.supplier?.name}
      />

      {/* Footer nav */}
      <div style={{ marginTop: '36px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link href={`/supplierdirectory/${slug}`} style={{
          fontSize: '13px', fontWeight: 600, color: '#185D7A', textDecoration: 'none',
        }}>
          ← Back to {widget.supplier?.name ?? 'Supplier'}
        </Link>
        <Link href="/suppliers" style={{
          fontSize: '13px', fontWeight: 600, color: '#6b7280', textDecoration: 'none',
        }}>
          ← Supplier Directory
        </Link>
      </div>

      <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
        Powered by BuildQuote
      </p>
    </div>
  )
}
