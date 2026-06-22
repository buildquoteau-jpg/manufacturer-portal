import { RFQPayload } from './types'

export function buildEmailHtml(payload: RFQPayload): string {
  const { builder, supplier, items, delivery, dateRequired, message, rfqId } = payload

  const itemRows = items.map((item, i) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:8px 12px;color:#6b7280;">${i + 1}</td>
      <td style="padding:8px 12px;font-weight:500;">${item.name}</td>
      <td style="padding:8px 12px;color:#6b7280;">${item.sku}</td>
      <td style="padding:8px 12px;color:#6b7280;">${item.uom}</td>
      <td style="padding:8px 12px;color:#6b7280;">${item.qty}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        
        <div style="background:#1f2937;padding:24px 32px;">
          <h1 style="color:#f97316;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">BuildQuote</h1>
          <p style="color:#9ca3af;margin:4px 0 0;font-size:14px;">Request for Quote</p>
        </div>

        <div style="padding:32px;">

          <table style="width:100%;margin-bottom:24px;">
            <tr>
              <td style="width:50%;vertical-align:top;">
                <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">From</p>
                <p style="margin:0;font-weight:600;">${builder.builderName}</p>
                <p style="margin:0;color:#6b7280;">${builder.company}</p>
                <p style="margin:0;color:#6b7280;">ABN: ${builder.abn}</p>
                <p style="margin:0;color:#6b7280;">${builder.phone}</p>
                <p style="margin:0;color:#6b7280;">${builder.email}</p>
              </td>
              <td style="width:50%;vertical-align:top;">
                <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">To</p>
                <p style="margin:0;font-weight:600;">${supplier.supplierName}</p>
                ${supplier.accountNumber ? `<p style="margin:0;color:#6b7280;">Account: ${supplier.accountNumber}</p>` : ''}
              </td>
            </tr>
          </table>

          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
           <p style="margin:0;color:#6b7280;font-size:14px;">
  <strong>Delivery:</strong> ${delivery === 'delivery' ? 'Delivery Required' : 'Store Pick-up'}
  ${delivery === 'delivery' && payload.siteAddress ? `&nbsp;|&nbsp;<strong>Site Address:</strong> ${payload.siteAddress}` : ''}
  &nbsp;|&nbsp;<strong>Date Required:</strong> ${dateRequired || 'ASAP'}
</p>
          </div>

          <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Line Items</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;">#</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;">Product</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;">SKU</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;">UOM</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;">Qty</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          ${message ? `
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Message</p>
            <p style="margin:0;color:#374151;">${message}</p>
          </div>
          ` : ''}

          <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
            <p style="margin:0;color:#6b7280;font-size:13px;"><strong>RFQ Reference:</strong> ${rfqId}</p>
            <p style="margin:0;color:#6b7280;font-size:13px;"><strong>Sent:</strong> ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

        </div>

        <div style="background:#f9fafb;padding:16px 32px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Sent via <strong style="color:#f97316;">BuildQuote</strong> — Southwest WA Builder Tools</p>
        </div>

      </div>
    </body>
    </html>
  `
}