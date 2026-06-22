import { notFound } from 'next/navigation'
import { getPublicSupplierDetail } from '@/lib/data/getPublicSuppliers'
import { getSupplierBrandWidget } from '@/lib/data/getSupplierBrandWidget'
import { ShowroomClient } from './ShowroomClient'

export const metadata = {
  title: 'Demo Supplier — BuildQuote Widget Showcase',
}

export default async function ShowroomPage() {
  const supplier = await getPublicSupplierDetail('demo-supplier')
  if (!supplier || supplier.brands.length === 0) return notFound()

  const widgetResults = await Promise.all(
    supplier.brands.map(b => getSupplierBrandWidget('demo-supplier', b.slug))
  )

  const widgets = supplier.brands
    .map((brand, i) => ({ brand, widget: widgetResults[i]! }))
    .filter(w => w.widget !== null)

  if (widgets.length === 0) return notFound()

  return (
    <ShowroomClient
      widgets={widgets}
      supplier={supplier}
    />
  )
}
