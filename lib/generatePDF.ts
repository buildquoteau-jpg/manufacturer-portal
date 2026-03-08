import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { RFQPayload } from './types'

export async function generatePDFBuffer(payload: RFQPayload): Promise<Buffer> {
  const { builder, supplier, items, delivery, dateRequired, message, rfqId } = payload

  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const orange = rgb(0.976, 0.451, 0.086)
  const dark = rgb(0.122, 0.161, 0.216)
  const grey = rgb(0.42, 0.44, 0.47)
  const white = rgb(1, 1, 1)
  const lightgrey = rgb(0.97, 0.98, 0.98)

  let y = height

  // Header background
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: dark })
  page.drawText('BuildQuote', { x: 32, y: height - 40, size: 22, font: bold, color: orange })
  page.drawText('Request for Quote', { x: 32, y: height - 58, size: 10, font: regular, color: rgb(0.6, 0.6, 0.6) })

  y = height - 90

  // FROM / TO
  page.drawText('FROM', { x: 32, y, size: 8, font: bold, color: orange })
  page.drawText('TO', { x: 300, y, size: 8, font: bold, color: orange })
  y -= 16
  page.drawText(builder.builderName, { x: 32, y, size: 11, font: bold, color: dark })
  page.drawText(supplier.supplierName, { x: 300, y, size: 11, font: bold, color: dark })
  y -= 14
  page.drawText(builder.company, { x: 32, y, size: 10, font: regular, color: grey })
  if (supplier.accountNumber) page.drawText(`Account: ${supplier.accountNumber}`, { x: 300, y, size: 10, font: regular, color: grey })
  y -= 12
  page.drawText(`ABN: ${builder.abn}`, { x: 32, y, size: 10, font: regular, color: grey })
  y -= 12
  page.drawText(builder.phone, { x: 32, y, size: 10, font: regular, color: grey })
  y -= 12
  page.drawText(builder.email, { x: 32, y, size: 10, font: regular, color: grey })

  y -= 20

  // Delivery bar
  page.drawRectangle({ x: 32, y: y - 10, width: width - 64, height: 24, color: lightgrey })
  page.drawText(`Delivery: ${delivery === 'delivery' ? 'Delivery Required' : 'Store Pick-up'}   |   Date Required: ${dateRequired || 'ASAP'}`, {
    x: 40, y: y - 4, size: 9, font: regular, color: grey
  })
  y -= 28

  // Line items header
  y -= 16
  page.drawText('LINE ITEMS', { x: 32, y, size: 8, font: bold, color: orange })
  y -= 14

  // Table header
  page.drawRectangle({ x: 32, y: y - 8, width: width - 64, height: 20, color: dark })
  page.drawText('#', { x: 38, y: y - 2, size: 8, font: bold, color: white })
  page.drawText('Product Name', { x: 58, y: y - 2, size: 8, font: bold, color: white })
  page.drawText('SKU', { x: 290, y: y - 2, size: 8, font: bold, color: white })
  page.drawText('UOM', { x: 370, y: y - 2, size: 8, font: bold, color: white })
  page.drawText('Qty', { x: 430, y: y - 2, size: 8, font: bold, color: white })
  y -= 22

  // Table rows
  items.forEach((item, i) => {
    if (y < 80) return // prevent overflow for now
    const bg = i % 2 === 0 ? white : lightgrey
    page.drawRectangle({ x: 32, y: y - 8, width: width - 64, height: 18, color: bg })
    page.drawText(`${i + 1}`, { x: 38, y: y - 2, size: 8, font: regular, color: grey })
    page.drawText(item.name.substring(0, 38), { x: 58, y: y - 2, size: 8, font: regular, color: dark })
    page.drawText(item.sku.substring(0, 14), { x: 290, y: y - 2, size: 8, font: regular, color: grey })
    page.drawText(item.uom.substring(0, 8), { x: 370, y: y - 2, size: 8, font: regular, color: grey })
    page.drawText(item.qty.substring(0, 8), { x: 430, y: y - 2, size: 8, font: regular, color: grey })
    y -= 18
  })

  y -= 20

  // Message
  if (message) {
    page.drawText('MESSAGE', { x: 32, y, size: 8, font: bold, color: orange })
    y -= 14
    const words = message.split(' ')
    let line = ''
    for (const word of words) {
      if ((line + word).length > 80) {
        page.drawText(line.trim(), { x: 32, y, size: 9, font: regular, color: grey })
        y -= 12
        line = ''
      }
      line += word + ' '
    }
    if (line.trim()) {
      page.drawText(line.trim(), { x: 32, y, size: 9, font: regular, color: grey })
      y -= 12
    }
    y -= 8
  }

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 40, color: lightgrey })
  page.drawText(`RFQ Reference: ${rfqId}   |   Sent: ${new Date().toLocaleDateString('en-AU')}   |   Sent via BuildQuote`, {
    x: 32, y: 14, size: 8, font: regular, color: grey
  })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}