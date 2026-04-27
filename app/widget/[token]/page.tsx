import { getWidgetData } from '@/lib/data/getWidgetData'
import { notFound } from 'next/navigation'
import { ManufacturerHero } from './ManufacturerHero'
import { WidgetClient } from './WidgetClient'

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const widget = await getWidgetData(token)

  if (!widget) return notFound()

  return (
    <div style={{
      padding: '24px 20px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh',
    }}>
      {/* Brand hero */}
      <ManufacturerHero
        manufacturer={widget.manufacturer}
        supplierName={widget.supplier?.name}
      />

      {/* Profile count */}
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>
        {widget.systems.length === 1
          ? '1 profile available'
          : `${widget.systems.length} profiles available`}
      </p>

      {/* Cards grid with enquiry modal */}
      <WidgetClient
        systems={widget.systems}
        widgetId={widget.id}
        supplierName={widget.supplier?.name}
      />

      {/* Footer */}
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
        fontSize: '11px',
        color: '#d1d5db',
      }}>
        Powered by BuildQuote
      </div>
    </div>
  )
}
