import { RFQPayload } from './types'

export function generateCSVString(payload: RFQPayload): string {
  const headers = ['Product Name', 'SKU', 'Product ID', 'Description/Specs', 'Unit of Measure', 'Quantity']
  
  const rows = payload.items.map(item => [
    item.name,
    item.sku,
    item.productId,
    item.desc,
    item.uom,
    item.qty,
  ].map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))

  return [headers.join(','), ...rows].join('\n')
}