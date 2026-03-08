'use client'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SectionLabel from '../ui/SectionLabel'
import { RFQPayload } from '@/lib/types'

interface SuccessScreenProps {
  rfqId: string
  payload: RFQPayload
  onReset: () => void
}

export default function SuccessScreen({ rfqId, payload, onReset }: SuccessScreenProps) {
  const download = async (type: 'pdf' | 'csv') => {
    const res = await fetch(`/api/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rfqId}.${type}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4 items-center text-center">
      <div className="text-6xl mt-4">✅</div>
      <h1 className="text-3xl font-bold text-white">RFQ Sent!</h1>
      <p className="text-gray-400">Your quote request has been sent to {payload.supplier.supplierName}.</p>

      <Card className="w-full text-left">
        <SectionLabel>RFQ Reference</SectionLabel>
        <p className="text-orange-500 font-mono text-xl font-bold">{rfqId}</p>
      </Card>

      <Card className="w-full flex flex-col gap-3">
        <SectionLabel>Downloads</SectionLabel>
        <Button variant="secondary" onClick={() => download('pdf')} className="w-full py-3">
          ⬇ Download PDF
        </Button>
        <Button variant="secondary" onClick={() => download('csv')} className="w-full py-3">
          ⬇ Download CSV
        </Button>
      </Card>

      <Button onClick={onReset} className="w-full py-3">
        + Start Another RFQ
      </Button>

      <div className="w-full flex gap-3 items-start bg-gray-900 border border-gray-700 rounded-lg p-4 text-left">
        <span className="text-yellow-500 text-sm mt-0.5 flex-shrink-0">⚠</span>
        <p className="text-gray-400 text-xs leading-relaxed">
          BuildQuote does not track builder to supplier Requests for Quotation. Please call your preferred supplier to confirm receipt and product availability.
        </p>
      </div>

      <div className="flex gap-3 w-full">
        <a
          href="/directory"
          className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 text-sm font-semibold hover:border-gray-500 hover:text-gray-300 transition-colors text-center"
        >
          ← Back to Directory
        </a>
        <a
          href="/portfolio"
          className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 text-sm font-semibold hover:border-gray-500 hover:text-gray-300 transition-colors text-center"
        >
          ↖ Portfolio
        </a>
      </div>
    </div>
  )
}
