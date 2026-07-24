// Shopping-list PNG share/export — extracted verbatim from BuildQuote v6's
// ShoppingListDrawerUI so the exact same image ships from Studio previews and,
// later, static card packages. Pure client-side: Canvas → PNG →
// navigator.share(files) on mobile, download fallback on desktop.

import type { ShoppingListItem } from './types'

export async function shareShoppingListPng(shoppingList: ShoppingListItem[]): Promise<void> {
  if (shoppingList.length === 0) return

  // Layout — full table: # | Profile & Specs | SKU | UOM | QTY
  const W = 660, PAD = 26
  const HH = 80   // header band
  const CH = 30   // column-header row
  const FH = 46   // footer band
  const ROW_PAD_Y = 11
  const NAME_LH = 18, DESC_LH = 15, SKU_LH = 14

  // Column x positions
  const xIndex   = PAD                    // # (left)
  const xName    = PAD + 24                // name / specs (left)
  const xSku     = 392                     // SKU column (left)
  const skuMaxW  = 150
  const xUom     = 568                     // UOM (center)
  const xQty     = W - PAD                 // QTY (right)
  const nameMaxW = xSku - xName - 16

  // Measure pass — need a context to wrap text and compute row heights.
  const measureCanvas = document.createElement('canvas')
  const mctx = measureCanvas.getContext('2d')!

  function wrap(text: string, font: string, maxW: number): string[] {
    if (!text) return []
    mctx.font = font
    const words = text.split(/\s+/)
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (mctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines
  }

  // SKUs/part numbers have no spaces (only hyphens), so wrap breaks them at
  // hyphens — keeping the hyphen at the end of each line — then hard-breaks
  // any remaining segment that's still too wide.
  function wrapSku(text: string, font: string, maxW: number): string[] {
    if (!text) return []
    mctx.font = font
    const parts = text.split('-')
    const lines: string[] = []
    let line = ''
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i] + (i < parts.length - 1 ? '-' : '')
      const test = line + seg
      if (mctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = seg
      } else {
        line = test
      }
      // Hard-break a single segment that still overflows.
      while (mctx.measureText(line).width > maxW && line.length > 1) {
        let cut = line.length
        while (cut > 1 && mctx.measureText(line.slice(0, cut)).width > maxW) cut--
        lines.push(line.slice(0, cut))
        line = line.slice(cut)
      }
    }
    if (line) lines.push(line)
    return lines
  }

  const NAME_FONT = '600 14px Arial, Helvetica, sans-serif'
  const DESC_FONT = '12px Arial, Helvetica, sans-serif'
  const SKU_FONT  = '11px "Courier New", monospace'

  const rows = shoppingList.map(item => {
    const nameLines = wrap(item.name, NAME_FONT, nameMaxW)
    const descLines = item.desc ? wrap(item.desc, DESC_FONT, nameMaxW) : []
    const skuLines  = item.sku ? wrapSku(item.sku, SKU_FONT, skuMaxW) : []
    const leftH = nameLines.length * NAME_LH + descLines.length * DESC_LH
    const skuH  = skuLines.length * SKU_LH
    const contentH = Math.max(leftH, skuH, NAME_LH)
    return { item, nameLines, descLines, skuLines, height: contentH + ROW_PAD_Y * 2 }
  })

  const bodyH = rows.reduce((sum, r) => sum + r.height, 0)
  const H = HH + CH + bodyH + FH

  const canvas = document.createElement('canvas')
  canvas.width = W * 2; canvas.height = H * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)
  ctx.textBaseline = 'alphabetic'

  // White bg
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

  // Header gradient band
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, '#185D7A'); g.addColorStop(1, '#0f4461')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH)

  // BuildQuote wordmark
  ctx.textAlign = 'left'
  ctx.font = 'bold 22px Arial, Helvetica, sans-serif'
  ctx.fillStyle = '#ffffff'; ctx.fillText('Build', PAD, HH / 2)
  const bw = ctx.measureText('Build').width
  ctx.fillStyle = '#f97316'; ctx.fillText('Quote', PAD + bw, HH / 2)

  // Subtitle
  ctx.font = '12px Arial, Helvetica, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillText('Materials List', PAD, HH / 2 + 20)

  // Date
  ctx.font = '11px Arial, Helvetica, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'right'
  ctx.fillText(new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), W - PAD, HH / 2)
  ctx.textAlign = 'left'

  // Column header row
  ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, HH, W, CH)
  ctx.font = '700 10px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#64748b'
  const chY = HH + CH / 2 + 4
  ctx.textAlign = 'left'
  ctx.fillText('#', xIndex, chY)
  ctx.fillText('PROFILE & SPECS', xName, chY)
  ctx.fillText('SKU / PART NO', xSku, chY)
  ctx.textAlign = 'center'; ctx.fillText('UOM', xUom, chY)
  ctx.textAlign = 'right';  ctx.fillText('QTY', xQty, chY)
  ctx.textAlign = 'left'

  // Item rows
  let y = HH + CH
  rows.forEach(({ item, nameLines, descLines, skuLines, height }, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#ffffff'; ctx.fillRect(0, y, W, height)

    // Index
    ctx.font = '12px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left'
    ctx.fillText(String(i + 1), xIndex, y + ROW_PAD_Y + 12)

    // Name (wrapped) + specs
    let ly = y + ROW_PAD_Y + 12
    ctx.font = NAME_FONT; ctx.fillStyle = '#0f172a'
    for (const line of nameLines) { ctx.fillText(line, xName, ly); ly += NAME_LH }
    if (descLines.length) {
      ctx.font = DESC_FONT; ctx.fillStyle = '#6b7280'
      for (const line of descLines) { ctx.fillText(line, xName, ly); ly += DESC_LH }
    }

    // SKU (wrapped, monospace)
    let sy = y + ROW_PAD_Y + 11
    ctx.font = SKU_FONT; ctx.fillStyle = '#475569'
    if (skuLines.length) {
      for (const line of skuLines) { ctx.fillText(line, xSku, sy); sy += SKU_LH }
    } else {
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('—', xSku, sy)
    }

    // UOM (centered)
    ctx.font = '700 11px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#185D7A'; ctx.textAlign = 'center'
    ctx.fillText(item.uom || 'EA', xUom, y + ROW_PAD_Y + 12)

    // Qty (right)
    ctx.font = 'bold 15px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#0f172a'; ctx.textAlign = 'right'
    ctx.fillText(String(item.qty), xQty, y + ROW_PAD_Y + 13)
    ctx.textAlign = 'left'

    // Divider
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(0, y + height); ctx.lineTo(W, y + height); ctx.stroke()

    y += height
  })

  // Footer
  ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, y, W, FH)
  ctx.font = '11px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'
  ctx.fillText(`buildquote.com.au  ·  ${shoppingList.length} item${shoppingList.length !== 1 ? 's' : ''}`, W / 2, y + FH / 2 + 4)
  ctx.textAlign = 'left'

  await new Promise<void>(resolve => {
    canvas.toBlob(async blob => {
      if (!blob) { resolve(); return }
      const file = new File([blob], 'materials-list.png', { type: 'image/png' })
      try {
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'BuildQuote Materials List',
            text: `My materials list — ${shoppingList.length} item${shoppingList.length !== 1 ? 's' : ''}`,
            files: [file],
          })
        } else {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url
          a.download = `materials-list-${new Date().toISOString().slice(0, 10)}.png`; a.click()
          URL.revokeObjectURL(url)
        }
      } catch { /* user cancelled */ }
      resolve()
    }, 'image/png')
  })
}
