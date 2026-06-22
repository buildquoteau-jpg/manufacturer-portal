import { notFound } from 'next/navigation'
import { getPublicSupplierDetail } from '@/lib/data/getPublicSuppliers'
import { getSupplierBrandWidget } from '@/lib/data/getSupplierBrandWidget'
import { EmbedClient } from './EmbedClient'

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supplier = await getPublicSupplierDetail(slug)

  if (!supplier || supplier.brands.length === 0) return notFound()

  // Fetch all brand widgets in parallel
  const widgetResults = await Promise.all(
    supplier.brands.map(b => getSupplierBrandWidget(slug, b.slug))
  )

  const widgets = supplier.brands
    .map((brand, i) => ({ brand, widget: widgetResults[i]! }))
    .filter(w => w.widget !== null)

  if (widgets.length === 0) return notFound()

  return (
    <EmbedClient
      widgets={widgets}
      supplierName={supplier.name}
    />
  )
}
